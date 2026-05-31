import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CropsService } from './crops.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AgentOrchestrator } from '@/agents/agent-orchestrator.service';
import { EVENT_TYPES } from '@/agents/types/agent.types';
import { CropStatus } from '@prisma/client';

const mockPrisma = {
  garden: {
    findUnique: jest.fn(),
  },
  crop: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  inventory: {
    create: jest.fn(),
  },
};

const mockOrchestrator = {
  emitEvent: jest.fn(),
};

describe('CropsService', () => {
  let service: CropsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CropsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AgentOrchestrator, useValue: mockOrchestrator },
      ],
    }).compile();

    service = module.get<CropsService>(CropsService);
    jest.clearAllMocks();
  });

  const userId = 'user-1';
  const gardenId = 'garden-1';
  const cropId = 'crop-1';

  const mockGarden = {
    id: gardenId,
    name: 'My Garden',
    userId,
    soilQuality: 50,
    irrigationLevel: 50,
    sunlightExposure: 50,
  };

  const mockCrop = {
    id: cropId,
    name: 'Tomato',
    species: 'Solanum lycopersicum',
    status: CropStatus.SEED,
    growthStage: 0,
    health: 100,
    hydration: 50,
    nutrientLevel: 50,
    plotX: 0,
    plotY: 0,
    gardenId,
    userId,
    plantedAt: new Date(),
    lastWateredAt: null,
    lastFertilizedAt: null,
    estimatedHarvest: new Date(Date.now() + 7 * 86400000),
    harvestedAt: null,
    weatherStressed: false,
    stressFactor: 0,
  };

  describe('plant', () => {
    it('should plant a crop successfully', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);
      mockPrisma.crop.create.mockResolvedValue(mockCrop);

      const result = await service.plant(userId, {
        name: 'Tomato',
        species: 'Solanum lycopersicum',
        plotX: 0,
        plotY: 0,
      });

      expect(mockPrisma.crop.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Tomato',
            status: 'SEED',
            gardenId,
            userId,
          }),
        }),
      );
      expect(mockOrchestrator.emitEvent).toHaveBeenCalled();
      expect(result.status).toBe(CropStatus.SEED);
    });

    it('should throw NotFoundException if user has no garden', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(null);

      await expect(service.plant(userId, { name: 'Tomato' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should set estimated harvest to 7 days from now', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);
      const before = Date.now();
      mockPrisma.crop.create.mockResolvedValue(mockCrop);

      await service.plant(userId, { name: 'Tomato' });

      const createCall = mockPrisma.crop.create.mock.calls[0][0];
      const estHarvest = new Date(createCall.data.estimatedHarvest).getTime();
      expect(estHarvest - before).toBeGreaterThan(6.9 * 86400000);
    });
  });

  describe('batchPlant', () => {
    it('should plant multiple crops', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);
      mockPrisma.crop.create.mockResolvedValue(mockCrop);

      const result = await service.batchPlant(userId, {
        crops: [
          { name: 'Tomato', plotX: 0, plotY: 0 },
          { name: 'Basil', plotX: 1, plotY: 0 },
        ],
      });

      expect(mockPrisma.crop.create).toHaveBeenCalledTimes(2);
      expect(mockOrchestrator.emitEvent).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('getByGarden', () => {
    it('should return crops for user garden', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);
      mockPrisma.crop.findMany.mockResolvedValue([mockCrop]);

      const result = await service.getByGarden(userId);

      expect(mockPrisma.crop.findMany).toHaveBeenCalledWith({
        where: { gardenId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException if no garden', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(null);

      await expect(service.getByGarden('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });

    it('should return empty array when garden has no crops', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);
      mockPrisma.crop.findMany.mockResolvedValue([]);

      const result = await service.getByGarden(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return crop by id', async () => {
      mockPrisma.crop.findFirst.mockResolvedValue(mockCrop);

      const result = await service.getById(cropId, userId);

      expect(result).toEqual(mockCrop);
    });

    it('should throw NotFoundException for other users crop', async () => {
      mockPrisma.crop.findFirst.mockResolvedValue(null);

      await expect(service.getById(cropId, 'other-user'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('water', () => {
    it('should increase hydration by 30, capped at 100', async () => {
      const dryCrop = { ...mockCrop, hydration: 20 };
      const wetCrop = { ...mockCrop, hydration: 50 };
      mockPrisma.crop.findFirst.mockResolvedValue(dryCrop);
      mockPrisma.crop.update.mockResolvedValue(wetCrop);

      await service.water(cropId, userId);

      expect(mockPrisma.crop.update).toHaveBeenCalledWith({
        where: { id: cropId },
        data: expect.objectContaining({ hydration: 50 }),
      });
      expect(mockOrchestrator.emitEvent).toHaveBeenCalled();
    });

    it('should cap hydration at 100', async () => {
      const almostWet = { ...mockCrop, hydration: 90 };
      mockPrisma.crop.findFirst.mockResolvedValue(almostWet);
      mockPrisma.crop.update.mockResolvedValue({ ...almostWet, hydration: 100 });

      const result = await service.water(cropId, userId);

      expect(result.hydration).toBe(100);
    });

    it('should set lastWateredAt timestamp', async () => {
      mockPrisma.crop.findFirst.mockResolvedValue(mockCrop);
      mockPrisma.crop.update.mockResolvedValue({
        ...mockCrop,
        hydration: 80,
        lastWateredAt: new Date(),
      });

      const result = await service.water(cropId, userId);

      expect(result.lastWateredAt).toBeDefined();
    });

    it('should reduce stressFactor after watering', async () => {
      const stressedCrop = { ...mockCrop, hydration: 30, stressFactor: 50 };
      mockPrisma.crop.findFirst.mockResolvedValue(stressedCrop);
      mockPrisma.crop.update.mockResolvedValue({
        ...stressedCrop,
        hydration: 60,
        stressFactor: 30,
        weatherStressed: false,
      });

      const result = await service.water(cropId, userId);

      expect(result.stressFactor).toBe(30);
      expect(result.weatherStressed).toBe(false);
    });
  });

  describe('fertilize', () => {
    it('should increase nutrientLevel by 40, capped at 100', async () => {
      const lowN = { ...mockCrop, nutrientLevel: 30 };
      mockPrisma.crop.findFirst.mockResolvedValue(lowN);
      mockPrisma.crop.update.mockResolvedValue({ ...lowN, nutrientLevel: 70 });

      const result = await service.fertilize(cropId, userId);

      expect(result.nutrientLevel).toBe(70);
    });

    it('should cap nutrientLevel at 100', async () => {
      const highN = { ...mockCrop, nutrientLevel: 80 };
      mockPrisma.crop.findFirst.mockResolvedValue(highN);
      mockPrisma.crop.update.mockResolvedValue({ ...highN, nutrientLevel: 100 });

      const result = await service.fertilize(cropId, userId);

      expect(result.nutrientLevel).toBe(100);
    });

    it('should set lastFertilizedAt timestamp', async () => {
      mockPrisma.crop.findFirst.mockResolvedValue(mockCrop);
      mockPrisma.crop.update.mockResolvedValue({
        ...mockCrop,
        nutrientLevel: 90,
        lastFertilizedAt: new Date(),
      });

      const result = await service.fertilize(cropId, userId);

      expect(result.lastFertilizedAt).toBeDefined();
      expect(mockOrchestrator.emitEvent).toHaveBeenCalled();
    });
  });

  describe('harvest', () => {
    it('should harvest a mature crop', async () => {
      const matureCrop = { ...mockCrop, status: CropStatus.MATURE, health: 80 };
      mockPrisma.crop.findFirst.mockResolvedValue(matureCrop);
      mockPrisma.inventory.create.mockResolvedValue({});
      mockPrisma.crop.update.mockResolvedValue({
        ...matureCrop,
        status: CropStatus.HARVESTED,
        harvestedAt: new Date(),
      });

      const result = await service.harvest(cropId, userId);

      expect(mockPrisma.inventory.create).toHaveBeenCalled();
      expect(mockPrisma.crop.update).toHaveBeenCalled();
      expect(mockOrchestrator.emitEvent).toHaveBeenCalledTimes(2);
      expect(result.status).toBe(CropStatus.HARVESTED);
    });

    it('should throw BadRequestException if crop is not MATURE', async () => {
      mockPrisma.crop.findFirst.mockResolvedValue(mockCrop);

      await expect(service.harvest(cropId, userId))
        .rejects.toThrow(BadRequestException);
    });

    it('should calculate yield based on health', async () => {
      const matureCrop = { ...mockCrop, status: CropStatus.MATURE, health: 100 };
      mockPrisma.crop.findFirst.mockResolvedValue(matureCrop);
      mockPrisma.inventory.create.mockResolvedValue({});
      mockPrisma.crop.update.mockResolvedValue({
        ...matureCrop,
        status: CropStatus.HARVESTED,
      });

      await service.harvest(cropId, userId);

      const inventoryCall = mockPrisma.inventory.create.mock.calls[0][0];
      expect(inventoryCall.data.quantity).toBeGreaterThanOrEqual(1);
      expect(inventoryCall.data.rarity).toBe('RARE');
    });

    it('should award XP on harvest', async () => {
      const matureCrop = { ...mockCrop, status: CropStatus.MATURE, health: 80 };
      mockPrisma.crop.findFirst.mockResolvedValue(matureCrop);
      mockPrisma.inventory.create.mockResolvedValue({});
      mockPrisma.crop.update.mockResolvedValue({
        ...matureCrop,
        status: CropStatus.HARVESTED,
      });

      await service.harvest(cropId, userId);

      expect(mockOrchestrator.emitEvent).toHaveBeenCalledWith(
        expect.any(String),
        EVENT_TYPES.XP_AWARDED,
        expect.any(Object),
      );
    });
  });

  describe('bulkWater', () => {
    it('should water all active crops', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);
      mockPrisma.crop.findMany.mockResolvedValue([mockCrop]);
      mockPrisma.crop.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.bulkWater(userId);

      expect(mockPrisma.crop.updateMany).toHaveBeenCalledWith({
        where: { gardenId, status: { notIn: ['HARVESTED', 'WILTED'] } },
        data: { hydration: { increment: 20 }, lastWateredAt: expect.any(Date), weatherStressed: false },
      });
      expect(mockOrchestrator.emitEvent).toHaveBeenCalled();
      expect(result.updated).toBe(1);
    });
  });

  describe('bulkFertilize', () => {
    it('should fertilize all active crops', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);
      mockPrisma.crop.findMany.mockResolvedValue([mockCrop]);
      mockPrisma.crop.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.bulkFertilize(userId);

      expect(mockPrisma.crop.updateMany).toHaveBeenCalledWith({
        where: { gardenId, status: { notIn: ['HARVESTED', 'WILTED'] } },
        data: { nutrientLevel: { increment: 25 }, lastFertilizedAt: expect.any(Date) },
      });
      expect(result.updated).toBe(1);
    });
  });
});
