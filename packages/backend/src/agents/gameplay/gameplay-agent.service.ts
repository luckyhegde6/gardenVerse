import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { GamificationService } from '@/modules/gamification/gamification.service';
import { BaseAgent } from '../base-agent.service';
import { AgentOrchestrator } from '../agent-orchestrator.service';
import { AgentName, AgentEvent, EVENT_TYPES, AGENT_CONFIGS } from '../types/agent.types';

@Injectable()
export class GameplayAgent extends BaseAgent {
  protected readonly agentName = AgentName.GAMEPLAY;
  protected readonly agentVersion = '1.0.0';
  protected readonly eventSubscriptions = [
    EVENT_TYPES.CROP_PLANTED,
    EVENT_TYPES.CROP_WATERED,
    EVENT_TYPES.CROP_FERTILIZED,
    EVENT_TYPES.CROP_HARVESTED,
    EVENT_TYPES.WEATHER_UPDATED,
    EVENT_TYPES.WEATHER_ALERT,
    EVENT_TYPES.SENSOR_DATA,
    EVENT_TYPES.DEVICE_ONLINE,
    EVENT_TYPES.DEVICE_OFFLINE,
    EVENT_TYPES.PLANT_IDENTIFIED,
    EVENT_TYPES.DISEASE_DETECTED,
    EVENT_TYPES.TRADE_COMPLETE,
    EVENT_TYPES.ACTION_TAKEN,
  ];
  protected readonly eventEmissions = [
    EVENT_TYPES.CROP_GROWTH_TICK,
    EVENT_TYPES.CROP_HEALTH_CHANGED,
    EVENT_TYPES.XP_AWARDED,
    EVENT_TYPES.LEVEL_UP,
    EVENT_TYPES.REWARD_ISSUED,
    EVENT_TYPES.STREAK_UPDATED,
  ];

  private readonly GROWTH_INTERVAL_HOURS = 4;
  private readonly HYDRATION_DECAY_RATE = 5;
  private readonly NUTRIENT_DECAY_RATE = 3;
  private readonly BASE_XP_PER_ACTION = 10;

  constructor(
    orchestrator: AgentOrchestrator,
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {
    super(orchestrator);
    this.logger = new Logger(GameplayAgent.name);
    this.config = AGENT_CONFIGS[AgentName.GAMEPLAY];
  }

  async onEvent(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case EVENT_TYPES.CROP_PLANTED:
        await this.handleCropPlanted(event);
        break;
      case EVENT_TYPES.CROP_WATERED:
        await this.handleCropWatered(event);
        break;
      case EVENT_TYPES.CROP_FERTILIZED:
        await this.handleCropFertilized(event);
        break;
      case EVENT_TYPES.WEATHER_UPDATED:
        await this.handleWeatherUpdated(event);
        break;
      case EVENT_TYPES.WEATHER_ALERT:
        await this.handleWeatherAlert(event);
        break;
      case EVENT_TYPES.SENSOR_DATA:
        await this.handleSensorData(event);
        break;
      case EVENT_TYPES.PLANT_IDENTIFIED:
        await this.handleAwardXp(event.payload as { userId: string }, 25, 'plant_identified');
        break;
      case EVENT_TYPES.DISEASE_DETECTED:
        await this.handleDiseaseDetected(event);
        break;
      case EVENT_TYPES.TRADE_COMPLETE:
        await this.handleAwardXp(event.payload as { userId: string }, 50, 'marketplace_trade');
        break;
      case EVENT_TYPES.CROP_HARVESTED:
        await this.handleCropHarvested(event);
        break;
    }
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  async simulationTick() {
    this.logger.log('Running gameplay simulation tick...');
    const crops = await this.prisma.crop.findMany({
      where: {
        status: { in: ['SEED', 'SPROUTING', 'GROWING'] },
      },
      include: { garden: true },
    });

    let updated = 0;
    for (const crop of crops) {
      try {
        await this.simulateCropGrowth(crop);
        updated++;
      } catch (err) {
        this.logger.error(`Simulation failed for crop ${crop.id}: ${(err as Error).message}`);
      }
    }
    this.logger.log(`Simulation tick complete: ${updated}/${crops.length} crops updated`);
  }

  private async simulateCropGrowth(crop: any) {
    const weatherImpact = await this.getWeatherImpact(crop.garden.userId);
    const hydrationDecay = this.HYDRATION_DECAY_RATE * (1 - weatherImpact * 0.5);
    const nutrientDecay = this.NUTRIENT_DECAY_RATE;

    const newHydration = Math.max(0, crop.hydration - hydrationDecay);
    const newNutrientLevel = Math.max(0, crop.nutrientLevel - nutrientDecay);
    const waterStress = newHydration < 20 ? 0.3 : 0;
    const nutrientStress = newNutrientLevel < 20 ? 0.2 : 0;
    const healthDelta = -(waterStress + nutrientStress) * 5;
    const newHealth = Math.max(0, Math.min(100, crop.health + healthDelta));

    let newGrowthStage = crop.growthStage;
    let newStatus = crop.status;

    const isVirtual = crop.garden?.type === 'VIRTUAL';
    const growthSpeedMultiplier = isVirtual ? 100 : 1;

    if (newHealth > 20) {
      newGrowthStage = Math.min(100, crop.growthStage + (5 + weatherImpact * 3) * growthSpeedMultiplier);
    }

    if (newGrowthStage >= 100 && crop.status === 'GROWING') {
      newStatus = 'MATURE';
    } else if (newGrowthStage >= 50 && crop.status === 'SPROUTING') {
      newStatus = 'GROWING';
    } else if (newGrowthStage >= 10 && crop.status === 'SEED') {
      newStatus = 'SPROUTING';
    }

    if (newHealth <= 0) {
      newStatus = 'WILTED';
    }

    await this.prisma.crop.update({
      where: { id: crop.id },
      data: {
        growthStage: newGrowthStage,
        health: newHealth,
        hydration: newHydration,
        nutrientLevel: newNutrientLevel,
        status: newStatus,
        weatherStressed: waterStress > 0 || nutrientStress > 0,
      },
    });

    await this.emit(EVENT_TYPES.CROP_GROWTH_TICK, {
      cropId: crop.id,
      userId: crop.userId,
      newGrowthStage,
      newStatus,
      healthDelta,
      hydrationDelta: newHydration - crop.hydration,
      nutrientDelta: newNutrientLevel - crop.nutrientLevel,
      weatherImpactFactor: weatherImpact,
      timestamp: new Date().toISOString(),
    });
  }

  private async getWeatherImpact(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.region) return 0.5;

    const weather = await this.prisma.weatherRecord.findFirst({
      where: { region: { contains: user.region } },
      orderBy: { recordedAt: 'desc' },
    });

    if (!weather) return 0.5;

    let impact = 0.5;
    if (weather.condition === 'CLEAR') impact = 0.8;
    else if (weather.condition === 'CLOUDY') impact = 0.6;
    else if (weather.condition === 'RAIN') impact = 0.7;
    else if (weather.condition === 'DROUGHT') impact = 0.2;
    else if (weather.condition === 'STORM') impact = 0.1;
    else if (weather.condition === 'HEATWAVE') impact = 0.3;

    if (weather.temperature > 35 || weather.temperature < 10) impact -= 0.2;
    if (weather.humidity < 20) impact -= 0.15;
    if (weather.sunlightHours < 4) impact -= 0.1;

    return Math.max(0.05, Math.min(1.0, impact));
  }

  private async handleCropPlanted(event: AgentEvent) {
    const userId = (event.payload as any).userId;
    const speciesId = (event.payload as any).speciesId;
    await this.emit(EVENT_TYPES.XP_AWARDED, {
      userId, amount: 15, reason: 'planted_crop',
    });
    try {
      await this.gamificationService.awardXP(userId, 15);
      if (speciesId) {
        await this.gamificationService.discoverSpecies(userId, speciesId);
        await this.gamificationService.recordPlantAction(userId, speciesId, 'plant');
      }
    } catch (err) {
      this.logger.error(`Gamification error in handleCropPlanted: ${(err as Error).message}`);
    }
  }

  private async handleCropWatered(event: AgentEvent) {
    const payload = event.payload as any;
    await this.prisma.crop.update({
      where: { id: payload.cropId },
      data: { hydration: Math.min(100, payload.hydrationLevel || 80), lastWateredAt: new Date() },
    });
    try {
      await this.gamificationService.awardXP(payload.userId, 5);
      if (payload.cropId) {
        await this.gamificationService.updateCareStreak(payload.cropId, payload.userId);
      }
    } catch (err) {
      this.logger.error(`Gamification error in handleCropWatered: ${(err as Error).message}`);
    }
  }

  private async handleCropFertilized(event: AgentEvent) {
    const payload = event.payload as any;
    await this.prisma.crop.update({
      where: { id: payload.cropId },
      data: { nutrientLevel: Math.min(100, payload.nutrientLevel || 80), lastFertilizedAt: new Date() },
    });
    try {
      await this.gamificationService.awardXP(payload.userId, 10);
      if (payload.cropId) {
        await this.gamificationService.updateCareStreak(payload.cropId, payload.userId);
      }
    } catch (err) {
      this.logger.error(`Gamification error in handleCropFertilized: ${(err as Error).message}`);
    }
  }

  private async handleCropHarvested(event: AgentEvent) {
    const payload = event.payload as any;
    const speciesId = payload.speciesId;
    const healthBonus = payload.health ? Math.floor(payload.health / 4) : 0;
    const xpAmount = 25 + healthBonus;
    try {
      const result = await this.gamificationService.awardXP(payload.userId, xpAmount);
      if (speciesId) {
        await this.gamificationService.recordPlantAction(payload.userId, speciesId, 'harvest');
      }
      if (result.leveledUp) {
        await this.emit(EVENT_TYPES.LEVEL_UP, {
          userId: payload.userId, newLevel: result.newLevel, tokensAwarded: result.tokensAwarded,
        });
      }
    } catch (err) {
      this.logger.error(`Gamification error in handleCropHarvested: ${(err as Error).message}`);
    }
  }

  private async handleWeatherUpdated(event: AgentEvent) {
    const payload = event.payload as { region: string };
    const affectedGardens = await this.prisma.garden.findMany({
      where: { user: { region: { contains: payload.region } } },
      include: { crops: true },
    });

    for (const garden of affectedGardens) {
      for (const crop of garden.crops) {
        if (['SEED', 'SPROUTING', 'GROWING'].includes(crop.status)) {
          await this.simulateCropGrowth(crop);
        }
      }
    }
  }

  private async handleWeatherAlert(event: AgentEvent) {
    const payload = event.payload as { region: string; alertType: string; severity: string };
    const impactMap: Record<string, number> = {
      HEATWAVE: 0.2, DROUGHT: 0.15, STORM: 0.1, FLOOD: 0.05, FROST: 0.1,
    };
    const impact = impactMap[payload.alertType] || 0.3;

    const affectedGardens = await this.prisma.garden.findMany({
      where: { user: { region: { contains: payload.region } } },
    });

    for (const garden of affectedGardens) {
      const crops = await this.prisma.crop.findMany({
        where: { gardenId: garden.id, status: { in: ['SEED', 'SPROUTING', 'GROWING'] } },
      });

      for (const crop of crops) {
        await this.prisma.crop.update({
          where: { id: crop.id },
          data: {
            health: Math.max(0, crop.health - impact * 20),
            weatherStressed: true,
            stressFactor: impact,
          },
        });
      }
    }
  }

  private async handleSensorData(event: AgentEvent) {
    const payload = event.payload as any;
    if (payload.sensorType === 'SOIL_MOISTURE' && payload.value < 30) {
      const devices = await this.prisma.iotDevice.findFirst({
        where: { id: payload.deviceId },
        include: { user: { include: { garden: { include: { crops: true } } } } },
      });

      if (devices?.user?.garden?.crops) {
        for (const crop of devices.user.garden.crops) {
          if (crop.hydration < 30) {
            const newHealth = Math.max(0, crop.health - 5);
            await this.prisma.crop.update({
              where: { id: crop.id },
              data: { health: newHealth, weatherStressed: true },
            });
          }
        }
      }
    }
  }

  private async handleDiseaseDetected(event: AgentEvent) {
    const payload = event.payload as { cropId?: string; userId: string; severity: string };
    if (payload.cropId) {
      const healthPenalty = payload.severity === 'HIGH' ? 40 : payload.severity === 'MEDIUM' ? 20 : 10;
      await this.prisma.crop.update({
        where: { id: payload.cropId },
        data: { health: { decrement: healthPenalty }, status: 'DISEASED' },
      });
    }
    await this.handleAwardXp(event.payload as any, 10, 'disease_detected');
  }

  private async handleAwardXp(payload: { userId: string }, amount: number, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return;

    const newXp = user.experience + amount;
    const xpForNextLevel = user.level * 100;
    const newLevel = newXp >= xpForNextLevel ? user.level + 1 : user.level;
    const isLevelUp = newLevel > user.level;

    const streakUpdated = await this.updateStreak(payload.userId);
    const streakBonus = streakUpdated ? Math.floor(amount * (user.currentStreak * 0.01)) : 0;
    const totalAmount = amount + streakBonus;

    const updateData: any = {
      experience: { increment: totalAmount },
    };
    if (isLevelUp) {
      updateData.level = newLevel;
      updateData.greenCredits = { increment: newLevel * 10 };
    }

    await this.prisma.user.update({ where: { id: payload.userId }, data: updateData });

    await this.emit(EVENT_TYPES.XP_AWARDED, {
      userId: payload.userId,
      amount: totalAmount,
      reason,
      totalXp: newXp + totalAmount,
      levelBefore: user.level,
      levelAfter: newLevel,
    });

    if (isLevelUp) {
      await this.emit(EVENT_TYPES.LEVEL_UP, {
        userId: payload.userId,
        newLevel,
        rewards: { greenCredits: newLevel * 10 },
      });
    }
  }

  private async updateStreak(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const now = new Date();
    const lastActive = user.lastActiveAt;
    const hoursSinceActive = lastActive ? (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60) : Infinity;

    let newStreak = user.currentStreak;
    let updated = false;

    if (!lastActive || hoursSinceActive >= 24) {
      if (hoursSinceActive < 48) {
        newStreak = user.currentStreak + 1;
        updated = true;
      } else {
        newStreak = 1;
        updated = true;
      }
    }

    if (updated) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(user.longestStreak, newStreak),
          lastActiveAt: now,
        },
      });

      if (newStreak > 0 && newStreak % 7 === 0) {
        await this.emit(EVENT_TYPES.REWARD_ISSUED, {
          userId,
          rewardType: 'GREEN_CREDITS',
          amount: newStreak * 5,
          reason: `weekly_streak_${newStreak}`,
        });
      }
    }
    return updated;
  }
}
