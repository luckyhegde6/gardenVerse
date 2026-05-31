import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);
  private readonly XP_REWARDS = {
    PLANT: 15,
    WATER: 5,
    FERTILIZE: 10,
    HARVEST_BASE: 25,
    DISCOVER_SPECIES: 50,
    CREATE_HYBRID: 100,
    PERFECT_SPECIES: 200,
  };
  private readonly MASTERY_XP = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000];
  private readonly CARE_STREAK_BONUSES: Record<number, { label: string; healthBonus: number; xpMultiplier?: number; tokens?: number }> = {
    3: { label: '3-day', healthBonus: 5 },
    7: { label: '7-day', healthBonus: 15, xpMultiplier: 1.5 },
    14: { label: '14-day', healthBonus: 30, xpMultiplier: 2.0 },
    30: { label: '30-day', healthBonus: 50, xpMultiplier: 3.0, tokens: 100 },
  };

  constructor(private prisma: PrismaService) {}

  async getFullGamificationData(userId: string) {
    const [user, collections, masteries, hybrids] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { level: true, experience: true, greenCredits: true, ecoPoints: true },
      }),
      this.getCollectionStats(userId),
      this.getAllMasteries(userId),
      this.getUserHybrids(userId),
    ]);
    if (!user) throw new NotFoundException('User not found');
    return {
      level: user.level,
      experience: user.experience,
      xpForNextLevel: user.level * 100,
      greenCredits: user.greenCredits,
      ecoPoints: user.ecoPoints,
      collections,
      masteries,
      hybrids: hybrids.length,
    };
  }

  async getUserCollections(userId: string) {
    return this.prisma.plantCollection.findMany({
      where: { userId },
      include: {
        species: {
          select: { id: true, commonName: true, scientificName: true, family: true, imageUrl: true, difficulty: true, tags: true, companionSpeciesIds: true, baseYield: true },
        },
      },
      orderBy: { discoveredAt: 'desc' },
    });
  }

  async getCollectionStats(userId: string) {
    const [totalSpecies, discovered, masteries] = await Promise.all([
      this.prisma.plantSpecies.count(),
      this.prisma.plantCollection.count({ where: { userId } }),
      this.prisma.speciesMastery.count({ where: { userId, perfectedAt: { not: null } } }),
    ]);
    return { totalSpecies, discovered, mastered: masteries, completionRate: totalSpecies > 0 ? Math.round((discovered / totalSpecies) * 100) : 0 };
  }

  async discoverSpecies(userId: string, speciesId: string) {
    const existing = await this.prisma.plantCollection.findUnique({
      where: { userId_speciesId: { userId, speciesId } },
    });
    if (existing) return { discovered: false, message: 'Already discovered' };

    const collection = await this.prisma.plantCollection.create({ data: { userId, speciesId } });
    await this.awardXP(userId, this.XP_REWARDS.DISCOVER_SPECIES);
    await this.updateAchievementProgress(userId, 'species_collector', 1);

    const count = await this.prisma.plantCollection.count({ where: { userId } });
    this.logger.log(`User ${userId} discovered species ${speciesId} (total: ${count})`);
    return { discovered: true, collection, totalDiscovered: count, xpAwarded: this.XP_REWARDS.DISCOVER_SPECIES };
  }

  async recordPlantAction(userId: string, speciesId: string, action: 'plant' | 'harvest') {
    const collection = await this.prisma.plantCollection.upsert({
      where: { userId_speciesId: { userId, speciesId } },
      update: action === 'plant' ? { timesPlanted: { increment: 1 } } : { timesHarvested: { increment: 1 } },
      create: { userId, speciesId, ...(action === 'plant' ? { timesPlanted: 1 } : { timesHarvested: 1 }) },
    });
    await this.updateSpeciesMastery(userId, speciesId, action);
    return collection;
  }

  async getSpeciesMastery(userId: string, speciesId: string) {
    const [mastery, species] = await Promise.all([
      this.prisma.speciesMastery.findUnique({ where: { userId_speciesId: { userId, speciesId } } }),
      this.prisma.plantSpecies.findUnique({ where: { id: speciesId } }),
    ]);
    if (!species) throw new NotFoundException('Species not found');
    const level = mastery?.level || 1;
    const xp = mastery?.experience || 0;
    const xpForNext = this.MASTERY_XP[level] || this.MASTERY_XP[this.MASTERY_XP.length - 1] + 5000;
    return {
      speciesId, speciesName: species.commonName, level, experience: xp, xpForNext,
      progress: Math.min(100, Math.round((xp / xpForNext) * 100)),
      plantCount: mastery?.plantCount || 0, harvestCount: mastery?.harvestCount || 0,
      perfected: !!mastery?.perfectedAt, maxLevel: this.MASTERY_XP.length,
    };
  }

  async getAllMasteries(userId: string) {
    const masteries = await this.prisma.speciesMastery.findMany({
      where: { userId },
      include: { species: { select: { id: true, commonName: true, imageUrl: true, difficulty: true } } },
      orderBy: { level: 'desc' },
    });
    return masteries.map(m => ({
      speciesId: m.speciesId, speciesName: m.species.commonName, imageUrl: m.species.imageUrl,
      difficulty: m.species.difficulty, level: m.level, plantCount: m.plantCount,
      harvestCount: m.harvestCount, perfected: !!m.perfectedAt,
    }));
  }

  private async updateSpeciesMastery(userId: string, speciesId: string, action: 'plant' | 'harvest') {
    const xpGain = action === 'harvest' ? 25 : 10;
    const mastery = await this.prisma.speciesMastery.upsert({
      where: { userId_speciesId: { userId, speciesId } },
      update: {
        experience: { increment: xpGain },
        ...(action === 'plant' ? { plantCount: { increment: 1 } } : { harvestCount: { increment: 1 } }),
      },
      create: { userId, speciesId, experience: xpGain, ...(action === 'plant' ? { plantCount: 1 } : { harvestCount: 1 }) },
    });

    while (mastery.level < this.MASTERY_XP.length && mastery.experience >= (this.MASTERY_XP[mastery.level] || Infinity)) {
      await this.prisma.speciesMastery.update({
        where: { userId_speciesId: { userId, speciesId } },
        data: { level: mastery.level + 1, experience: { decrement: this.MASTERY_XP[mastery.level] || 0 } },
      });
      mastery.level++;
    }

    if (mastery.level >= this.MASTERY_XP.length && !mastery.perfectedAt) {
      await this.prisma.speciesMastery.update({
        where: { userId_speciesId: { userId, speciesId } },
        data: { perfectedAt: new Date() },
      });
      await this.awardXP(userId, this.XP_REWARDS.PERFECT_SPECIES);
      await this.updateAchievementProgress(userId, 'perfectionist', 1);
      this.logger.log(`User ${userId} perfected species ${speciesId}!`);
    }
    return { leveledUp: mastery.level > 1, newLevel: mastery.level };
  }

  async createHybrid(userId: string, parent1Id: string, parent2Id: string) {
    const [parent1, parent2] = await Promise.all([
      this.prisma.plantSpecies.findUnique({ where: { id: parent1Id } }),
      this.prisma.plantSpecies.findUnique({ where: { id: parent2Id } }),
    ]);
    if (!parent1 || !parent2) throw new NotFoundException('One or both parent species not found');

    const existing = await this.prisma.plantHybrid.findUnique({
      where: { parent1Id_parent2Id: { parent1Id, parent2Id } },
    });
    if (existing) return { created: false, message: 'Hybrid already exists', hybrid: existing };

    const hybridName = `${parent1.commonName}-${parent2.commonName} Hybrid`;
    const hybridScientificName = `x ${parent1.scientificName} ${String.fromCharCode(215)} ${parent2.scientificName}`;

    const resultSpecies = await this.prisma.plantSpecies.create({
      data: {
        commonName: hybridName, scientificName: hybridScientificName,
        family: parent1.family || parent2.family, difficulty: 'HARD', isHybrid: true,
        hybridRecipe: { parent1: parent1Id, parent2: parent2Id },
        tags: ['hybrid', ...(parent1.tags || []), ...(parent2.tags || [])],
        companionSpeciesIds: [...(parent1.companionSpeciesIds || []), ...(parent2.companionSpeciesIds || [])],
        baseYield: Math.round(((parent1.baseYield || 1) + (parent2.baseYield || 1)) / 2) + 1,
        tokensPerHarvest: Math.round(((parent1.tokensPerHarvest || 10) + (parent2.tokensPerHarvest || 10)) * 1.5),
      },
    });

    const hybrid = await this.prisma.plantHybrid.create({
      data: { parent1Id, parent2Id, resultSpeciesId: resultSpecies.id, discoveredById: userId },
    });

    await this.discoverSpecies(userId, resultSpecies.id);
    await this.awardXP(userId, this.XP_REWARDS.CREATE_HYBRID);
    await this.updateAchievementProgress(userId, 'hybrid_pioneer', 1);
    this.logger.log(`User ${userId} created hybrid: ${hybridName}`);
    return { created: true, hybrid, resultSpecies };
  }

  async getUserHybrids(userId: string) {
    return this.prisma.plantHybrid.findMany({
      where: { discoveredById: userId },
      include: {
        parent1: { select: { id: true, commonName: true, imageUrl: true } },
        parent2: { select: { id: true, commonName: true, imageUrl: true } },
        resultSpecies: { select: { id: true, commonName: true, imageUrl: true, difficulty: true } },
      },
      orderBy: { discoveredAt: 'desc' },
    });
  }

  async updateCareStreak(cropId: string, userId: string) {
    const crop = await this.prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop) throw new NotFoundException('Crop not found');

    const now = new Date();
    const hoursSinceLastCare = crop.lastWateredAt ? (now.getTime() - crop.lastWateredAt.getTime()) / 3600000 : 999;
    const newStreak = hoursSinceLastCare < 30 ? (crop.careStreak || 0) + 1 : 1;

    await this.prisma.crop.update({
      where: { id: cropId },
      data: { careStreak: newStreak, totalCareCount: { increment: 1 } },
    });

    await this.updateAchievementProgress(userId, 'care_taker', 1);

    const bonus = Object.entries(this.CARE_STREAK_BONUSES)
      .filter(([threshold]) => newStreak >= parseInt(threshold))
      .pop();
    if (bonus) {
      this.logger.log(`User ${userId} reached ${bonus[1].label} care streak on crop ${cropId}`);
      if (newStreak >= 7) await this.updateAchievementProgress(userId, 'streak_master', newStreak);
    }
    return { careStreak: newStreak, bonus: bonus ? bonus[1] : null };
  }

  async awardXP(userId: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { level: true, experience: true, greenCredits: true },
    });
    if (!user) throw new NotFoundException('User not found');

    let newXP = user.experience + amount;
    let newLevel = user.level;
    let tokensAwarded = 0;
    let leveledUp = false;

    while (newXP >= newLevel * 100) {
      newXP -= newLevel * 100;
      newLevel++;
      leveledUp = true;
      tokensAwarded += 100 + newLevel * 10;
    }

    const updateData: any = { experience: newXP, level: newLevel };
    if (tokensAwarded > 0) updateData.greenCredits = { increment: tokensAwarded };

    await this.prisma.user.update({ where: { id: userId }, data: updateData });

    if (tokensAwarded > 0) {
      await this.prisma.tokenTransaction.create({
        data: {
          userId, type: 'GREEN_CREDITS', amount: tokensAwarded,
          balanceBefore: user.greenCredits, balanceAfter: user.greenCredits + tokensAwarded,
          action: 'LEVEL_UP_REWARD', description: `Level up to ${newLevel} reward`,
        },
      });
    }
    return { leveledUp, newLevel, xpAwarded: amount, tokensAwarded };
  }

  private async updateAchievementProgress(userId: string, key: string, progress: number = 1) {
    const achievement = await this.prisma.achievement.findUnique({ where: { key } });
    if (!achievement) return;

    const existing = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
    });
    if (existing?.completedAt) return;

    const newProgress = Math.min(achievement.maxProgress, (existing?.progress || 0) + progress);
    const completed = newProgress >= achievement.maxProgress;

    await this.prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
      update: { progress: newProgress, completedAt: completed ? new Date() : undefined },
      create: { userId, achievementId: achievement.id, progress: newProgress, completedAt: completed ? new Date() : undefined },
    });

    if (completed) {
      if (achievement.xpReward > 0) await this.awardXP(userId, achievement.xpReward);
      if (achievement.tokenReward > 0) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { greenCredits: { increment: achievement.tokenReward } },
        });
      }
      this.logger.log(`User ${userId} completed achievement: ${achievement.name}`);
    }
  }

  async getAchievements(userId: string) {
    const [allAchievements, userProgress] = await Promise.all([
      this.prisma.achievement.findMany({ orderBy: { category: 'asc' } }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
    ]);
    const progressMap = new Map(userProgress.map(up => [up.achievement.key, up]));
    return allAchievements.map(a => ({
      id: a.id,
      key: a.key,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      maxProgress: a.maxProgress,
      xpReward: a.xpReward,
      tokenReward: a.tokenReward,
      progress: progressMap.get(a.key)?.progress || 0,
      completed: !!progressMap.get(a.key)?.completedAt,
      completedAt: progressMap.get(a.key)?.completedAt || null,
    }));
  }

  async initUserGamification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { greenCredits: true } });
    if (user && user.greenCredits === 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: userId }, data: { greenCredits: 100 } });
        await tx.tokenTransaction.create({
          data: {
            userId, type: 'GREEN_CREDITS', amount: 100,
            balanceBefore: 0, balanceAfter: 100,
            action: 'GENESIS_AWARD',
            description: 'Welcome to GardenVerse! Start with 100 tokens',
          },
        });
      });
    }
  }
}
