import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GardensService } from './gardens.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CropStatus } from '@prisma/client';

const mockPrisma = {
  garden: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  crop: {
    deleteMany: jest.fn(),
  },
};

describe('GardensService', () => {
  let service: GardensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GardensService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GardensService>(GardensService);
    jest.clearAllMocks();
  });

  const userId = 'user-1';
  const gardenId = 'garden-1';

  const mockGarden = {
    id: gardenId,
    name: 'My Garden',
    type: 'VIRTUAL',
    soilQuality: 50,
    irrigationLevel: 50,
    sunlightExposure: 50,
    userId,
    crops: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a garden when user has none', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(null);
      mockPrisma.garden.create.mockResolvedValue(mockGarden);

      const result = await service.create(userId, { name: 'My Garden' });

      expect(mockPrisma.garden.findUnique).toHaveBeenCalledWith({ where: { userId } });
      expect(mockPrisma.garden.create).toHaveBeenCalledWith({
        data: { name: 'My Garden', userId },
        include: { crops: true },
      });
      expect(result).toEqual(mockGarden);
    });

    it('should throw ForbiddenException if user already has a garden', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);

      await expect(service.create(userId, { name: 'Second Garden' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('should create garden with all optional fields', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(null);
      const fullGarden = {
        ...mockGarden,
        type: 'REAL',
        size: 16,
        soilQuality: 80,
        irrigationLevel: 70,
        sunlightExposure: 90,
        description: 'My sunny garden',
        latitude: 40.7128,
        longitude: -74.006,
      };
      mockPrisma.garden.create.mockResolvedValue(fullGarden);

      const result = await service.create(userId, {
        name: 'Sunny Garden',
        type: 'REAL' as any,
        size: 16,
        soilQuality: 80,
        irrigationLevel: 70,
        sunlightExposure: 90,
        description: 'My sunny garden',
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(mockPrisma.garden.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'REAL',
          size: 16,
          soilQuality: 80,
        }),
        include: { crops: true },
      });
      expect(result.soilQuality).toBe(80);
    });
  });

  describe('findByUserId', () => {
    it('should return the user garden', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);

      const result = await service.findByUserId(userId);

      expect(result).toEqual(mockGarden);
    });

    it('should throw NotFoundException when garden does not exist', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(null);

      await expect(service.findByUserId('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });

    it('should include crops in the result', async () => {
      const gardenWithCrops = {
        ...mockGarden,
        crops: [
          { id: 'crop-1', name: 'Tomato', status: 'GROWING', health: 85, plotX: 0, plotY: 0 },
        ],
      };
      mockPrisma.garden.findUnique.mockResolvedValue(gardenWithCrops);

      const result = await service.findByUserId(userId);

      expect(result.crops).toHaveLength(1);
      expect(result.crops[0].name).toBe('Tomato');
    });
  });

  describe('findById', () => {
    it('should return garden by id', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);

      const result = await service.findById(gardenId);

      expect(result).toEqual(mockGarden);
    });

    it('should throw NotFoundException for invalid id', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(null);

      await expect(service.findById('invalid-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update garden soil quality', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);
      const updated = { ...mockGarden, soilQuality: 75 };
      mockPrisma.garden.update.mockResolvedValue(updated);

      const result = await service.update(userId, { soilQuality: 75 });

      expect(result.soilQuality).toBe(75);
    });

    it('should throw NotFoundException for missing garden', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'New' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should update multiple fields at once', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);
      const updated = {
        ...mockGarden,
        name: 'Updated Garden',
        soilQuality: 90,
        irrigationLevel: 85,
      };
      mockPrisma.garden.update.mockResolvedValue(updated);

      const result = await service.update(userId, {
        name: 'Updated Garden',
        soilQuality: 90,
        irrigationLevel: 85,
      });

      expect(mockPrisma.garden.update).toHaveBeenCalledWith({
        where: { userId },
        data: { name: 'Updated Garden', soilQuality: 90, irrigationLevel: 85 },
        include: { crops: true },
      });
      expect(result.name).toBe('Updated Garden');
    });
  });

  describe('delete', () => {
    it('should delete garden and its crops', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);

      const result = await service.delete(userId);

      expect(mockPrisma.crop.deleteMany).toHaveBeenCalledWith({
        where: { gardenId: gardenId },
      });
      expect(mockPrisma.garden.delete).toHaveBeenCalledWith({
        where: { id: gardenId },
      });
      expect(result).toEqual({ message: 'Garden deleted successfully' });
    });

    it('should throw NotFoundException for missing garden', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getAnalytics', () => {
    it('should return zero values for empty garden', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);

      const result = await service.getAnalytics(userId);

      expect(result.totalCrops).toBe(0);
      expect(result.healthPercentage).toBe(0);
    });

    it('should calculate correct analytics for garden with crops', async () => {
      const gardenWithCrops = {
        ...mockGarden,
        crops: [
          { id: 'c1', name: 'Tomato', status: CropStatus.GROWING, health: 90 },
          { id: 'c2', name: 'Basil', status: CropStatus.MATURE, health: 85 },
          { id: 'c3', name: 'Lettuce', status: CropStatus.DISEASED, health: 30 },
          { id: 'c4', name: 'Carrot', status: CropStatus.HARVESTED, health: 95 },
          { id: 'c5', name: 'Mint', status: CropStatus.WILTED, health: 10 },
        ],
      };
      mockPrisma.garden.findUnique.mockResolvedValue(gardenWithCrops);

      const result = await service.getAnalytics(userId);

      expect(result.totalCrops).toBe(5);
      expect(result.healthyCrops).toBe(3);
      expect(result.diseasedCrops).toBe(1);
      expect(result.matureCrops).toBe(1);
      expect(result.harvestedCrops).toBe(1);
      expect(result.healthPercentage).toBe(60);
    });

    it('should include garden soil, irrigation, and sunlight in analytics', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);

      const result = await service.getAnalytics(userId);

      expect(result.soilQuality).toBe(50);
      expect(result.irrigationLevel).toBe(50);
      expect(result.sunlightExposure).toBe(50);
    });
  });
});
