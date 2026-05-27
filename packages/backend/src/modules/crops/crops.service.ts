import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PlantCropDto, BatchPlantCropDto, UpdateCropDto } from './dto/crop.dto';
import { AgentOrchestrator } from '@/agents/agent-orchestrator.service';
import { AgentName, EVENT_TYPES } from '@/agents/types/agent.types';

@Injectable()
export class CropsService {
  private readonly logger = new Logger(CropsService.name);

  constructor(
    private prisma: PrismaService,
    private orchestrator: AgentOrchestrator,
  ) {}

  async plant(userId: string, dto: PlantCropDto) {
    const garden = await this.prisma.garden.findUnique({ where: { userId } });
    if (!garden) {
      throw new NotFoundException('User has no garden');
    }

    const estimatedHarvest = new Date();
    estimatedHarvest.setDate(estimatedHarvest.getDate() + 7);

    const crop = await this.prisma.crop.create({
      data: {
        ...dto,
        status: 'SEED',
        gardenId: garden.id,
        userId,
        estimatedHarvest,
      },
    });

    await this.orchestrator.emitEvent(AgentName.GAMEPLAY, EVENT_TYPES.CROP_PLANTED, {
      cropId: crop.id,
      userId,
      gardenId: garden.id,
      species: dto.name,
      plantedAt: crop.plantedAt.toISOString(),
      plotX: dto.plotX,
      plotY: dto.plotY,
    });

    return crop;
  }

  async batchPlant(userId: string, dto: BatchPlantCropDto) {
    const garden = await this.prisma.garden.findUnique({ where: { userId } });
    if (!garden) {
      throw new NotFoundException('User has no garden');
    }

    const crops = await Promise.all(
      dto.crops.map(async (cropData) => {
        const estimatedHarvest = new Date();
        estimatedHarvest.setDate(estimatedHarvest.getDate() + 7);

        const crop = await this.prisma.crop.create({
          data: {
            ...cropData,
            status: 'SEED',
            gardenId: garden.id,
            userId,
            estimatedHarvest,
          },
        });
        return crop;
      }),
    );

    for (const crop of crops) {
      await this.orchestrator.emitEvent(AgentName.GAMEPLAY, EVENT_TYPES.CROP_PLANTED, {
        cropId: crop.id, userId, gardenId: garden.id, species: crop.name,
        plantedAt: crop.plantedAt.toISOString(), plotX: crop.plotX, plotY: crop.plotY,
      });
    }

    return crops;
  }

  async getByGarden(userId: string) {
    const garden = await this.prisma.garden.findUnique({ where: { userId } });
    if (!garden) {
      throw new NotFoundException('User has no garden');
    }

    return this.prisma.crop.findMany({
      where: { gardenId: garden.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, userId: string) {
    const crop = await this.prisma.crop.findFirst({
      where: { id, userId },
    });

    if (!crop) {
      throw new NotFoundException('Crop not found');
    }

    return crop;
  }

  async update(id: string, userId: string, dto: UpdateCropDto) {
    const crop = await this.getById(id, userId);
    return this.prisma.crop.update({
      where: { id },
      data: dto,
    });
  }

  async water(id: string, userId: string) {
    const crop = await this.getById(id, userId);
    const hydration = Math.min(100, crop.hydration + 30);

    const updated = await this.prisma.crop.update({
      where: { id },
      data: { hydration, lastWateredAt: new Date(), weatherStressed: false, stressFactor: Math.max(0, crop.stressFactor - 20) },
    });

    await this.orchestrator.emitEvent(AgentName.GAMEPLAY, EVENT_TYPES.CROP_WATERED, {
      cropId: id, userId, hydrationLevel: hydration, wateredAt: new Date().toISOString(),
    });

    return updated;
  }

  async fertilize(id: string, userId: string) {
    const crop = await this.getById(id, userId);
    const nutrientLevel = Math.min(100, crop.nutrientLevel + 40);

    const updated = await this.prisma.crop.update({
      where: { id },
      data: { nutrientLevel, lastFertilizedAt: new Date() },
    });

    await this.orchestrator.emitEvent(AgentName.GAMEPLAY, EVENT_TYPES.CROP_FERTILIZED, {
      cropId: id, userId, fertilizerType: 'standard', nutrientLevel,
    });

    return updated;
  }

  async harvest(id: string, userId: string) {
    const crop = await this.getById(id, userId);

    if (crop.status !== 'MATURE') {
      throw new BadRequestException('Crop is not ready for harvest');
    }

    const yield_amount = Math.floor(1 + (crop.health / 100) * 5);

    await this.prisma.inventory.create({
      data: {
        userId,
        itemType: 'HARVEST',
        itemId: id,
        name: `${crop.name} Harvest`,
        quantity: yield_amount,
        rarity: crop.health > 80 ? 'RARE' : crop.health > 50 ? 'UNCOMMON' : 'COMMON',
      },
    });

    const harvested = await this.prisma.crop.update({
      where: { id },
      data: { status: 'HARVESTED', harvestedAt: new Date() },
    });

    await this.orchestrator.emitEvent(AgentName.GAMEPLAY, EVENT_TYPES.CROP_HARVESTED, {
      cropId: id, userId, yield: yield_amount, quality: crop.health, harvestedAt: new Date().toISOString(),
    });

    await this.orchestrator.emitEvent(AgentName.GAMEPLAY, EVENT_TYPES.XP_AWARDED, {
      userId, amount: 25 + Math.floor(crop.health / 4), reason: 'crop_harvested',
      totalXp: 0, levelBefore: 0, levelAfter: 0,
    });

    return harvested;
  }

  async bulkWater(userId: string) {
    const garden = await this.prisma.garden.findUnique({ where: { userId } });
    if (!garden) throw new NotFoundException('User has no garden');

    const crops = await this.prisma.crop.findMany({
      where: { gardenId: garden.id, status: { notIn: ['HARVESTED', 'WILTED'] } },
    });

    const result = await this.prisma.crop.updateMany({
      where: { gardenId: garden.id, status: { notIn: ['HARVESTED', 'WILTED'] } },
      data: { hydration: { increment: 20 }, lastWateredAt: new Date(), weatherStressed: false },
    });

    for (const crop of crops) {
      await this.orchestrator.emitEvent(AgentName.GAMEPLAY, EVENT_TYPES.CROP_WATERED, {
        cropId: crop.id, userId, hydrationLevel: Math.min(100, crop.hydration + 20),
        wateredAt: new Date().toISOString(),
      });
    }

    return { updated: result.count };
  }

  async bulkFertilize(userId: string) {
    const garden = await this.prisma.garden.findUnique({ where: { userId } });
    if (!garden) throw new NotFoundException('User has no garden');

    const crops = await this.prisma.crop.findMany({
      where: { gardenId: garden.id, status: { notIn: ['HARVESTED', 'WILTED'] } },
    });

    const result = await this.prisma.crop.updateMany({
      where: { gardenId: garden.id, status: { notIn: ['HARVESTED', 'WILTED'] } },
      data: { nutrientLevel: { increment: 25 }, lastFertilizedAt: new Date() },
    });

    for (const crop of crops) {
      await this.orchestrator.emitEvent(AgentName.GAMEPLAY, EVENT_TYPES.CROP_FERTILIZED, {
        cropId: crop.id, userId, fertilizerType: 'standard', nutrientLevel: Math.min(100, crop.nutrientLevel + 25),
      });
    }

    return { updated: result.count };
  }
}
