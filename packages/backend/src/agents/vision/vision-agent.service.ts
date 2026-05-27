import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { BaseAgent } from '../base-agent.service';
import { AgentOrchestrator } from '../agent-orchestrator.service';
import { AgentName, AgentEvent, EVENT_TYPES, AGENT_CONFIGS } from '../types/agent.types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class VisionAgent extends BaseAgent {
  protected readonly agentName = AgentName.VISION;
  protected readonly agentVersion = '1.0.0';
  protected readonly eventSubscriptions: string[] = [];
  protected readonly eventEmissions = [
    EVENT_TYPES.PLANT_IDENTIFIED,
    EVENT_TYPES.DISEASE_DETECTED,
    EVENT_TYPES.GROWTH_ANALYZED,
  ];

  constructor(
    orchestrator: AgentOrchestrator,
    private prisma: PrismaService,
    private http: HttpService,
    private configService: ConfigService,
  ) {
    super(orchestrator);
    this.logger = new Logger(VisionAgent.name);
    this.config = AGENT_CONFIGS[AgentName.VISION];
  }

  async onEvent(_event: AgentEvent): Promise<void> {}

  async analyzePlantScan(imageUrl: string, userId: string): Promise<any> {
    const aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL');

    if (aiServiceUrl) {
      try {
        return await this.callAiService(aiServiceUrl, imageUrl, userId);
      } catch (err) {
        this.logger.warn(`AI service call failed, falling back to local analysis: ${err}`);
      }
    }

    return this.localAnalysis(imageUrl, userId);
  }

  private async callAiService(aiServiceUrl: string, imageUrl: string, userId: string) {
    const { data } = await firstValueFrom(
      this.http.post(`${aiServiceUrl}/api/v1/plant/identify`, {
        imageUrl,
        userId,
      }),
    );

    const healthData = await firstValueFrom(
      this.http.post(`${aiServiceUrl}/api/v1/plant/health`, {
        imageUrl,
        plantName: data.plantName,
        species: data.species,
      }),
    ).then(r => r.data).catch(() => ({ healthScore: 80, recommendations: [] }));

    let diseaseData: { diseases: any[]; recommendations: string[] } = { diseases: [], recommendations: [] };
    if (data.species) {
      diseaseData = await firstValueFrom(
        this.http.post(`${aiServiceUrl}/api/v1/disease/detect`, {
          imageUrl,
          plantSpecies: data.species,
        }),
      ).then(r => r.data).catch(() => ({ diseases: [], recommendations: [] }));
    }

    const scan = await this.prisma.aiScan.create({
      data: {
        imageUrl,
        userId,
        plantName: data.plantName,
        species: data.species,
        healthScore: healthData.healthScore,
        diseases: diseaseData.diseases,
        recommendations: [
          ...(healthData.recommendations || []),
          ...(diseaseData.recommendations || []),
        ],
      },
    });

    const confidence = data.confidence || 0.8;
    if (confidence > 0.6) {
      await this.emit(EVENT_TYPES.PLANT_IDENTIFIED, {
        scanId: scan.id, userId,
        plantName: data.plantName, species: data.species,
        confidence, healthScore: healthData.healthScore, imageUrl,
      });

      const significantDisease = (diseaseData.diseases || []).find(
        (d: any) => d.severity === 'HIGH' || d.severity === 'MEDIUM',
      );
      if (significantDisease) {
        await this.emit(EVENT_TYPES.DISEASE_DETECTED, {
          scanId: scan.id, userId,
          diseaseName: significantDisease.name,
          confidence: significantDisease.confidence,
          severity: significantDisease.severity,
          treatmentRecommendations: diseaseData.recommendations,
        });
      }
    }

    return scan;
  }

  private async localAnalysis(imageUrl: string, userId: string) {
    const plantData = this.mockPlantIdentification(imageUrl);
    const healthData = this.mockHealthAnalysis();
    const diseaseData = this.mockDiseaseDetection(plantData.species);

    const scan = await this.prisma.aiScan.create({
      data: {
        imageUrl, userId,
        plantName: plantData.plantName,
        species: plantData.species,
        healthScore: healthData.healthScore,
        diseases: diseaseData.diseases,
        recommendations: [...healthData.recommendations, ...diseaseData.recommendations],
      },
    });

    if (plantData.confidence > 0.6) {
      await this.emit(EVENT_TYPES.PLANT_IDENTIFIED, {
        scanId: scan.id, userId,
        plantName: plantData.plantName, species: plantData.species,
        confidence: plantData.confidence,
        healthScore: healthData.healthScore, imageUrl,
      });

      const significantDisease = (diseaseData.diseases || []).find(
        (d: any) => d.severity === 'HIGH' || d.severity === 'MEDIUM',
      );
      if (significantDisease) {
        await this.emit(EVENT_TYPES.DISEASE_DETECTED, {
          scanId: scan.id, userId,
          diseaseName: significantDisease.name,
          confidence: significantDisease.confidence,
          severity: significantDisease.severity,
          treatmentRecommendations: diseaseData.recommendations,
        });
      }
    }

    return scan;
  }

  async analyzeGrowth(userId: string, cropId: string): Promise<any> {
    const crop = await this.prisma.crop.findFirst({ where: { id: cropId, userId } });
    if (!crop) throw new Error('Crop not found');

    const daysSincePlanted = Math.floor((Date.now() - crop.plantedAt.getTime()) / (1000 * 60 * 60 * 24));
    const growthProgress = crop.growthStage;

    let speciesInfo = null;
    if (crop.speciesId) {
      speciesInfo = await this.prisma.plantSpecies.findUnique({
        where: { id: crop.speciesId },
      });
    }

    const issues: string[] = [];
    if (crop.health < 40) issues.push('Low health — check for disease or nutrient deficiency');
    if (crop.hydration < 25) issues.push('Underwatered — increase irrigation');
    if (crop.nutrientLevel < 25) issues.push('Low nutrients — apply fertilizer');

    const result = {
      cropId: crop.id,
      species: crop.name,
      scientificName: speciesInfo?.scientificName,
      daysSincePlanted,
      currentStage: crop.status,
      growthProgress,
      estimatedDaysToMaturity: speciesInfo?.growingDays
        ? Math.max(0, speciesInfo.growingDays - daysSincePlanted)
        : undefined,
      healthStatus: crop.health > 70 ? 'HEALTHY' : crop.health > 40 ? 'STRESSED' : 'CRITICAL',
      issues,
      recommendations: this.generateGrowthRecommendations(crop, speciesInfo),
    };

    await this.emit(EVENT_TYPES.GROWTH_ANALYZED, result);
    return result;
  }

  private mockPlantIdentification(imageUrl: string) {
    const plants = [
      { plantName: 'Tomato', species: 'Solanum lycopersicum', confidence: 0.92 },
      { plantName: 'Basil', species: 'Ocimum basilicum', confidence: 0.88 },
      { plantName: 'Lettuce', species: 'Lactuca sativa', confidence: 0.85 },
      { plantName: 'Mint', species: 'Mentha spicata', confidence: 0.91 },
      { plantName: 'Marigold', species: 'Tagetes erecta', confidence: 0.79 },
      { plantName: 'Rose', species: 'Rosa indica', confidence: 0.94 },
      { plantName: 'Spinach', species: 'Spinacia oleracea', confidence: 0.87 },
      { plantName: 'Coriander', species: 'Coriandrum sativum', confidence: 0.83 },
    ];
    const hash = imageUrl.length % plants.length;
    return plants[hash];
  }

  private mockHealthAnalysis() {
    const healthScore = 50 + Math.random() * 50;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (healthScore < 60) {
      issues.push('Possible nutrient deficiency detected');
      recommendations.push('Apply balanced NPK fertilizer (10-10-10)');
      recommendations.push('Check soil pH — optimal range is 6.0-7.0');
    }
    if (healthScore < 40) {
      issues.push('Signs of stress — check watering schedule');
      recommendations.push('Increase watering frequency');
      recommendations.push('Add organic mulch to retain moisture');
    }
    if (healthScore >= 80) {
      recommendations.push('Plant is thriving — continue current care routine');
      recommendations.push('Consider pruning to encourage bushier growth');
    }

    return { healthScore: Math.round(healthScore * 10) / 10, issues, recommendations };
  }

  private mockDiseaseDetection(species: string) {
    const diseaseDb: Record<string, any> = {
      'Solanum lycopersicum': {
        diseases: [
          { name: 'Early Blight', confidence: 0.82, severity: 'MEDIUM' as const },
          { name: 'Septoria Leaf Spot', confidence: 0.71, severity: 'LOW' as const },
        ],
        recommendations: [
          'Remove affected leaves immediately',
          'Apply copper-based fungicide',
          'Improve air circulation around plants',
          'Avoid overhead watering',
        ],
      },
      'Ocimum basilicum': {
        diseases: [
          { name: 'Fusarium Wilt', confidence: 0.75, severity: 'HIGH' as const },
        ],
        recommendations: [
          'Remove infected plants to prevent spread',
          'Improve soil drainage',
          'Rotate planting location next season',
        ],
      },
    };

    return diseaseDb[species] || {
      diseases: [],
      recommendations: ['Monitor plant regularly for any signs of disease'],
    };
  }

  private generateGrowthRecommendations(crop: any, speciesInfo?: any): string[] {
    const recs: string[] = [];
    if (crop.hydration < 40) recs.push('Increase watering — soil moisture is low');
    if (crop.nutrientLevel < 40) recs.push('Apply fertilizer to boost nutrient levels');
    if (crop.health < 50) recs.push('Check for pests and diseases');
    if (crop.growthStage > 80) recs.push('Crop is nearing maturity — prepare for harvest');
    if (speciesInfo?.growingDays) {
      const daysSincePlanted = Math.floor((Date.now() - crop.plantedAt.getTime()) / (1000 * 60 * 60 * 24));
      const remaining = speciesInfo.growingDays - daysSincePlanted;
      if (remaining <= 7 && remaining > 0) recs.push(`Only ${remaining} days to harvest — check readiness daily`);
    }
    if (recs.length === 0) recs.push('Crop is on track — continue regular care');
    return recs;
  }
}
