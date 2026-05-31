import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PlantsService {
  private readonly logger = new Logger(PlantsService.name);
  private readonly openfarmApi = 'https://openfarm.cc/api/v1';
  private readonly trefleApi = 'https://trefle.io/api/v1';

  constructor(
    private prisma: PrismaService,
    private http: HttpService,
    private config: ConfigService,
  ) {}

  async searchPlants(query: string, page = 1, limit = 20) {
    const dbResults = await this.prisma.plantSpecies.findMany({
      where: {
        OR: [
          { commonName: { contains: query, mode: 'insensitive' } },
          { scientificName: { contains: query, mode: 'insensitive' } },
          { family: { contains: query, mode: 'insensitive' } },
          { tags: { has: query.toLowerCase() } },
        ],
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { commonName: 'asc' },
    });

    if (dbResults.length > 0) return { data: dbResults, source: 'database', page, limit };

    return this.searchExternalApi(query, page, limit);
  }

  async searchExternalApi(query: string, page = 1, limit = 20) {
    try {
      const trefleKey = this.config.get<string>('TREFLE_API_KEY');
      if (trefleKey) {
        const { data } = await firstValueFrom(
          this.http.get(`${this.trefleApi}/plants`, {
            params: { q: query, page, token: trefleKey },
          }),
        );
        const mapped = (data.data || []).map((p: any) => ({
          commonName: p.common_name || p.scientific_name,
          scientificName: p.scientific_name,
          family: p.family_common_name,
          genus: p.genus,
          imageUrl: p.image_url,
          growingDays: p.growth_days,
          dataSource: 'trefle',
          externalId: String(p.id),
        }));
        return { data: mapped, source: 'trefle', page, limit };
      }
    } catch (err) {
      this.logger.warn(`Trefle API error: ${err}`);
    }

    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.openfarmApi}/crops`, {
          params: { filter: query, page },
        }),
      );
      const mapped = (data.data || []).map((c: any) => ({
        commonName: c.attributes?.name || query,
        scientificName: c.attributes?.scientific_name || '',
        description: c.attributes?.description,
        growingDays: c.attributes?.growing_degree_days,
        difficulty: this.mapDifficulty(c.attributes?.difficulty),
        imageUrl: c.attributes?.main_image_path,
        dataSource: 'openfarm',
        externalId: c.id,
      }));
      return { data: mapped, source: 'openfarm', page, limit };
    } catch (err) {
      this.logger.warn(`OpenFarm API error: ${err}`);
    }

    return { data: [], source: 'none', page, limit };
  }

  async getPlantById(id: string) {
    return this.prisma.plantSpecies.findUnique({
      where: { id },
      include: { cropVarieties: true },
    });
  }

  async getPlantsBySeason(season: string, difficulty?: string) {
    const where: any = { seasons: { has: season.toLowerCase() } };
    if (difficulty) where.difficulty = difficulty.toUpperCase();
    return this.prisma.plantSpecies.findMany({ where, orderBy: { commonName: 'asc' } });
  }

  async getGardenPlanTemplates(season?: string, difficulty?: string) {
    const where: any = { isPublic: true };
    if (season) where.season = season;
    if (difficulty) where.difficulty = difficulty.toUpperCase();
    return this.prisma.gardenPlan.findMany({
      where,
      include: {
        plants: {
          include: { species: true },
          orderBy: [{ plotY: 'asc' }, { plotX: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGardenPlanById(id: string) {
    return this.prisma.gardenPlan.findUnique({
      where: { id },
      include: {
        plants: {
          include: { species: true },
          orderBy: [{ plotY: 'asc' }, { plotX: 'asc' }],
        },
      },
    });
  }

  async createGardenPlan(data: {
    name: string; description?: string; difficulty?: string;
    gridWidth?: number; gridHeight?: number; season?: string;
    plants: Array<{ speciesId: string; plotX: number; plotY: number; quantity?: number }>;
  }) {
    return this.prisma.gardenPlan.create({
      data: {
        name: data.name,
        description: data.description,
        difficulty: data.difficulty || 'MEDIUM',
        gridWidth: data.gridWidth || 4,
        gridHeight: data.gridHeight || 4,
        season: data.season,
        isPublic: false,
        plants: {
          create: data.plants.map(p => ({
            speciesId: p.speciesId,
            plotX: p.plotX,
            plotY: p.plotY,
            quantity: p.quantity || 1,
          })),
        },
      },
      include: { plants: { include: { species: true } } },
    });
  }

  async getRecommendedPlants(gardenId: string) {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });
    if (!garden) throw new Error('Garden not found');

    const month = new Date().getMonth();
    const season = month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'fall' : 'winter';

    const plants = await this.prisma.plantSpecies.findMany({
      where: {
        seasons: { has: season },
        minTemp: garden.latitude ? { lte: 40 } : undefined,
        maxTemp: garden.latitude ? { gte: 0 } : undefined,
      },
      orderBy: { difficulty: 'asc' },
      take: 10,
    });

    return plants.map((p: any) => ({
      ...p,
      matchScore: this.calculateMatchScore(p, garden),
      reason: this.getPlantReason(p, season, garden),
    })).sort((a: any, b: any) => b.matchScore - a.matchScore);
  }

  @Cron(CronExpression.EVERY_WEEK)
  async syncFromOpenFarm() {
    this.logger.log('Syncing plant data from OpenFarm...');
    const commonCrops = ['tomato', 'basil', 'lettuce', 'carrot', 'spinach', 'pepper', 'cucumber', 'mint', 'strawberry', 'sunflower', 'lavender', 'rosemary', 'thyme', 'kale', 'broccoli', 'cauliflower', 'onion', 'garlic', 'pea', 'bean', 'corn', 'squash', 'watermelon', 'pumpkin'];
    let count = 0;

    for (const crop of commonCrops) {
      try {
        const existing = await this.prisma.plantSpecies.findFirst({
          where: { commonName: { equals: crop, mode: 'insensitive' } },
        });
        if (existing) continue;

        const { data } = await firstValueFrom(
          this.http.get(`${this.openfarmApi}/crops`, {
            params: { filter: crop },
          }),
        );

        const entry = data.data?.[0];
        if (!entry?.attributes) continue;

        const attrs = entry.attributes;
        const seasons = [];
        if (attrs.spring_planting) seasons.push('spring');
        if (attrs.summer_planting) seasons.push('summer');
        if (attrs.fall_planting) seasons.push('fall');
        if (attrs.winter_planting) seasons.push('winter');

        await this.prisma.plantSpecies.upsert({
          where: { scientificName: attrs.scientific_name || crop },
          update: {},
          create: {
            commonName: attrs.name || crop,
            scientificName: attrs.scientific_name || crop,
            description: attrs.description?.substring(0, 1000),
            family: attrs.taxonomy?.family,
            genus: attrs.taxonomy?.genus,
            imageUrl: attrs.main_image_path,
            growingDays: attrs.growing_degree_days,
            difficulty: this.mapDifficulty(attrs.difficulty),
            minTemp: attrs.minimum_temperature,
            maxTemp: attrs.maximum_temperature,
            waterNeeds: (attrs.water_requirements || 'MODERATE').toUpperCase(),
            sunlightNeeds: (attrs.sun_requirements || 'FULL_SUN').toUpperCase().replace(/ /g, '_'),
            matureHeightCm: attrs.height,
            spacingCm: attrs.row_spacing,
            seasons: seasons.length > 0 ? seasons : ['spring', 'summer'],
            edible: true,
            tags: [crop, ...(attrs.tags || [])],
            dataSource: 'openfarm',
            externalId: entry.id,
          },
        });
        count++;
      } catch (err) {
        this.logger.debug(`Skipped ${crop}: ${err instanceof Error ? err.message : err}`);
      }
    }
    this.logger.log(`Synced ${count} new plants from OpenFarm`);
  }

  private mapDifficulty(difficulty?: string): string {
    if (!difficulty) return 'MEDIUM';
    const map: Record<string, string> = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD', expert: 'EXPERT' };
    return map[difficulty.toLowerCase()] || 'MEDIUM';
  }

  private calculateMatchScore(plant: any, garden: any): number {
    let score = 50;
    if (plant.difficulty === 'EASY') score += 15;
    if (garden.soilQuality > 60) score += 10;
    if (garden.sunlightExposure > 60 && plant.sunlightNeeds === 'FULL_SUN') score += 10;
    if (garden.irrigationLevel > 60 && plant.waterNeeds === 'HIGH') score += 5;
    return score;
  }

  private getPlantReason(plant: any, season: string, garden: any): string {
    if (plant.difficulty === 'EASY') return 'Easy to grow — great for beginners';
    if (plant.difficulty === 'HARD') return 'Requires experience — rewarding challenge';
    if (plant.sunlightNeeds === 'FULL_SUN' && garden.sunlightExposure > 60) return 'Thrives in your sunny garden';
    if (plant.waterNeeds === 'LOW' && garden.irrigationLevel < 40) return 'Drought-tolerant — ideal for your setup';
    return `Perfect for ${season} planting`;
  }
}
