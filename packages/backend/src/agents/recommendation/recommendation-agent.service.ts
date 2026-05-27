import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BaseAgent } from '../base-agent.service';
import { AgentOrchestrator } from '../agent-orchestrator.service';
import { AgentName, AgentEvent, EVENT_TYPES, AGENT_CONFIGS } from '../types/agent.types';

@Injectable()
export class RecommendationAgent extends BaseAgent {
  protected readonly agentName = AgentName.RECOMMENDATION;
  protected readonly agentVersion = '1.0.0';
  protected readonly eventSubscriptions = [
    EVENT_TYPES.CROP_PLANTED,
    EVENT_TYPES.WEATHER_UPDATED,
    EVENT_TYPES.SENSOR_DATA,
    EVENT_TYPES.PLANT_IDENTIFIED,
  ];
  protected readonly eventEmissions = [
    EVENT_TYPES.RECOMMENDATION_WATERING,
    EVENT_TYPES.RECOMMENDATION_FERTILIZER,
    EVENT_TYPES.RECOMMENDATION_CROP,
    EVENT_TYPES.RECOMMENDATION_SUSTAINABILITY,
  ];

  private readonly OPTIMAL_MOISTURE = 60;
  private readonly OPTIMAL_TEMP_RANGE = { min: 18, max: 30 };
  private readonly OPTIMAL_PH_RANGE = { min: 6.0, max: 7.0 };

  constructor(
    orchestrator: AgentOrchestrator,
    private prisma: PrismaService,
  ) {
    super(orchestrator);
    this.logger = new Logger(RecommendationAgent.name);
    this.config = AGENT_CONFIGS[AgentName.RECOMMENDATION];
  }

  async onEvent(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case EVENT_TYPES.WEATHER_UPDATED:
        await this.handleWeatherForRecommendations(event);
        break;
      case EVENT_TYPES.SENSOR_DATA:
        await this.handleSensorForRecommendations(event);
        break;
    }
  }

  async getWateringRecommendation(userId: string, cropId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { garden: { include: { crops: true } } },
    });
    if (!user?.garden) throw new Error('No garden found');

    const crops = cropId ? user.garden.crops.filter((c: any) => c.id === cropId) : user.garden.crops;
    if (crops.length === 0) throw new Error('No crops found');

    const weather = await this.prisma.weatherRecord.findFirst({
      where: user.region ? { region: { contains: user.region } } : {},
      orderBy: { recordedAt: 'desc' },
    });

    const recommendations = crops.map((crop: any) => {
      const moistureDeficit = this.OPTIMAL_MOISTURE - crop.hydration;
      const shouldWater = moistureDeficit > 20;
      const tempFactor = weather ? this.getTemperatureFactor(weather.temperature) : 1;
      const rainFactor = weather && weather.rainfall > 5 ? 0.5 : 1;
      const amount = Math.max(0, Math.round(moistureDeficit * 10 * tempFactor * rainFactor));
      const urgency = moistureDeficit > 40 ? 'HIGH' : moistureDeficit > 20 ? 'MEDIUM' : 'LOW';

      const bestTime = this.getBestWateringTime();

      return {
        cropId: crop.id,
        cropName: crop.name,
        shouldWater,
        amount,
        unit: 'ml',
        bestTime,
        urgency,
        reason: this.getWateringReason(moistureDeficit, weather, crop),
      };
    });

    return recommendations;
  }

  async getFertilizerRecommendation(userId: string, cropId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { garden: { include: { crops: true } } },
    });
    if (!user?.garden) throw new Error('No garden found');

    const crops = cropId ? user.garden.crops.filter((c: any) => c.id === cropId) : user.garden.crops;

    return crops.map((crop: any) => {
      const nutrientDeficit = 50 - crop.nutrientLevel;
      const shouldFertilize = nutrientDeficit > 15;
      const growthStage = crop.status;
      const fertilizerType = this.getFertilizerType(growthStage, crop.name);
      const amount = Math.max(1, Math.round(Math.abs(nutrientDeficit) / 10));

      return {
        cropId: crop.id,
        cropName: crop.name,
        shouldFertilize,
        fertilizerType,
        amount,
        unit: 'g',
        frequency: shouldFertilize ? 'Every 14 days' : 'Every 30 days',
        reason: this.getFertilizerReason(nutrientDeficit, growthStage),
      };
    });
  }

  async getCropRecommendation(region: string, season?: string) {
    const currentSeason = season || this.getCurrentSeason();
    const temperature = await this.averageTemperature(region);

    const cropDatabase = await this.getCropDatabase();
    const suitable = cropDatabase.filter((crop) => {
      return crop.seasons.includes(currentSeason) &&
        temperature >= crop.minTemp &&
        temperature <= crop.maxTemp;
    });

    return suitable.map((crop) => ({
      name: crop.name,
      species: crop.species,
      season: currentSeason,
      difficulty: crop.difficulty,
      estimatedYield: crop.estimatedYield,
      daysToMaturity: crop.daysToMaturity,
      matchScore: this.calculateMatchScore(crop, temperature),
      tips: crop.tips.slice(0, 2),
    })).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  }

  async getSustainabilityTips(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { garden: true },
    });
    if (!user) return [];

    const tips: Array<{ title: string; description: string; impact: number; effort: 'LOW' | 'MEDIUM' | 'HIGH' }> = [];

    if (user.garden?.type === 'VIRTUAL') {
      tips.push({
        title: 'Start a Real Garden',
        description: 'Link a real garden to earn double sustainability points',
        impact: 50,
        effort: 'HIGH',
      });
    }

    if (user.garden?.soilQuality && user.garden.soilQuality < 50) {
      tips.push({
        title: 'Improve Soil Quality',
        description: 'Add compost and organic matter to boost soil health',
        impact: 30,
        effort: 'MEDIUM',
      });
    }

    if (user.currentStreak > 0) {
      tips.push({
        title: `Maintain Your ${user.currentStreak}-Day Streak`,
        description: 'Log in daily to earn streak bonuses and sustainability rewards',
        impact: Math.min(40, user.currentStreak),
        effort: 'LOW',
      });
    }

    const recentHarvests = await this.prisma.crop.count({
      where: { userId, status: 'HARVESTED', harvestedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    });
    if (recentHarvests > 0) {
      tips.push({
        title: 'Share Your Harvest on Marketplace',
        description: `You harvested ${recentHarvests} crops this month — list extras on the marketplace`,
        impact: 25,
        effort: 'LOW',
      });
    }

    tips.push({
      title: 'Use IoT Sensors',
      description: 'Connect soil moisture sensors to optimize water usage and reduce waste',
      impact: 35,
      effort: 'MEDIUM',
    });

    const deviceCount = await this.prisma.iotDevice.count({ where: { userId } });
    if (deviceCount > 0) {
      tips.push({
        title: 'Optimize Based on Sensor Data',
        description: `Your ${deviceCount} sensor(s) can help reduce water usage by up to 30%`,
        impact: 40,
        effort: 'LOW',
      });
    }

    return tips;
  }

  private async handleWeatherForRecommendations(event: AgentEvent) {
    const payload = event.payload as { region: string };
    const users = await this.prisma.user.findMany({
      where: { region: { contains: payload.region } },
      take: 10,
    });

    for (const user of users) {
      const wateringRecs = await this.getWateringRecommendation(user.id).catch(() => []);
      for (const rec of wateringRecs) {
        if (rec.shouldWater) {
          await this.emit(EVENT_TYPES.RECOMMENDATION_WATERING, {
            userId: user.id,
            type: 'watering',
            title: `💧 Water your ${rec.cropName}`,
            description: rec.reason,
            priority: rec.urgency as any,
            actionable: true,
            actionData: { cropId: rec.cropId, amount: rec.amount },
          });
        }
      }
    }
  }

  private async handleSensorForRecommendations(event: AgentEvent) {
    const payload = event.payload as { deviceId: string; userId: string; sensorType: string; value: number };
    if (payload.sensorType === 'SOIL_MOISTURE' && payload.value < 30) {
      await this.emit(EVENT_TYPES.RECOMMENDATION_WATERING, {
        userId: payload.userId,
        type: 'watering_urgent',
        title: '🚨 Soil Moisture Critical',
        description: `Soil moisture is ${payload.value}% — water your garden immediately`,
        priority: 'HIGH',
        actionable: true,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });
    }
  }

  private getBestWateringTime(): string {
    const hour = new Date().getHours();
    if (hour < 6 || hour > 18) return 'Now — early morning is ideal';
    if (hour < 10) return 'Now — morning watering is optimal';
    if (hour < 16) return 'Wait until evening (after 6 PM) to reduce evaporation';
    return 'Now — evening watering is good';
  }

  private getTemperatureFactor(temp: number): number {
    if (temp > 30) return 1.5;
    if (temp > 25) return 1.2;
    if (temp < 15) return 0.7;
    return 1.0;
  }

  private getWateringReason(moistureDeficit: number, weather?: any, crop?: any): string {
    if (moistureDeficit > 40) return `Critical: ${crop?.name || 'Crop'} needs immediate watering`;
    if (moistureDeficit > 20) return `Moisture levels are low — time to water ${crop?.name || 'crops'}`;
    if (weather?.rainfall && weather.rainfall > 10) return 'Recent rainfall has provided adequate moisture';
    return `${crop?.name || 'Crop'} moisture levels are adequate`;
  }

  private getFertilizerType(stage: string, cropName: string): string {
    if (stage === 'SEED' || stage === 'SPROUTING') return 'Balanced NPK (10-10-10)';
    if (stage === 'GROWING') return 'High-Nitrogen Fertilizer (20-10-10)';
    if (stage === 'MATURE') return 'High-Phosphorus Fertilizer (10-20-10)';
    return 'Organic Compost';
  }

  private getFertilizerReason(nutrientDeficit: number, stage: string): string {
    if (nutrientDeficit > 30) return 'Severe nutrient deficiency detected';
    if (nutrientDeficit > 15) return 'Nutrient levels are below optimal';
    if (stage === 'GROWING') return 'Growth stage requires additional nutrients';
    if (stage === 'MATURE') return 'Mature plants need phosphorus for fruit development';
    return 'Nutrient levels are adequate — maintain current schedule';
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private async averageTemperature(region: string): Promise<number> {
    const weather = await this.prisma.weatherRecord.findFirst({
      where: { region: { contains: region } },
      orderBy: { recordedAt: 'desc' },
    });
    return weather?.temperature || 22;
  }

  private async getCropDatabase(): Promise<any[]> {
    const plants = await this.prisma.plantSpecies.findMany({
      take: 50,
      orderBy: { commonName: 'asc' },
    });

    if (plants.length > 0) {
      return plants.map(p => ({
        name: p.commonName,
        species: p.scientificName,
        seasons: p.seasons,
        difficulty: p.difficulty,
        estimatedYield: 5,
        daysToMaturity: p.growingDays || 60,
        minTemp: p.minTemp || 10,
        maxTemp: p.maxTemp || 35,
        tips: [
          p.waterNeeds === 'HIGH' ? 'Requires consistent watering' : 'Moderate water needs',
          p.sunlightNeeds === 'FULL_SUN' ? 'Needs full sun (6+ hours)' : 'Tolerates partial shade',
        ],
      }));
    }

    return [
      { name: 'Tomato', species: 'Solanum lycopersicum', seasons: ['spring', 'summer'], difficulty: 'MEDIUM', estimatedYield: 5, daysToMaturity: 60, minTemp: 15, maxTemp: 35, tips: ['Require consistent watering', 'Support with stakes or cages'] },
      { name: 'Lettuce', species: 'Lactuca sativa', seasons: ['spring', 'fall'], difficulty: 'EASY', estimatedYield: 3, daysToMaturity: 45, minTemp: 10, maxTemp: 25, tips: ['Harvest outer leaves first', 'Keep soil consistently moist'] },
      { name: 'Basil', species: 'Ocimum basilicum', seasons: ['spring', 'summer'], difficulty: 'EASY', estimatedYield: 6, daysToMaturity: 50, minTemp: 18, maxTemp: 35, tips: ['Pinch tops for bushier growth', 'Needs full sun'] },
      { name: 'Carrot', species: 'Daucus carota', seasons: ['spring', 'fall'], difficulty: 'MEDIUM', estimatedYield: 8, daysToMaturity: 70, minTemp: 10, maxTemp: 25, tips: ['Loose, sandy soil is best', 'Thin seedlings to 2 inches apart'] },
      { name: 'Cucumber', species: 'Cucumis sativus', seasons: ['spring', 'summer'], difficulty: 'EASY', estimatedYield: 10, daysToMaturity: 55, minTemp: 16, maxTemp: 35, tips: ['Trellis for better yields', 'Harvest frequently'] },
      { name: 'Mint', species: 'Mentha spicata', seasons: ['spring', 'summer', 'fall'], difficulty: 'EASY', estimatedYield: 15, daysToMaturity: 30, minTemp: 10, maxTemp: 35, tips: ['Grows vigorously—use containers', 'Harvest leaves regularly'] },
    ];
  }

  private calculateMatchScore(crop: any, temperature: number): number {
    let score = 50;
    const midTemp = (crop.minTemp + crop.maxTemp) / 2;
    const tempDiff = Math.abs(temperature - midTemp);
    const tempRange = crop.maxTemp - crop.minTemp;
    score += Math.max(0, 30 - (tempDiff / tempRange) * 30);
    if (crop.difficulty === 'EASY') score += 10;
    return Math.round(score);
  }
}
