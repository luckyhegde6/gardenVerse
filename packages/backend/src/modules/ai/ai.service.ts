import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SubmitScanDto } from './dto/ai.dto';
import { VisionAgent } from '@/agents/vision/vision-agent.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private visionAgent: VisionAgent,
  ) {}

  async submitScan(userId: string, dto: SubmitScanDto) {
    const scan = await this.visionAgent.analyzePlantScan(dto.imageUrl, userId);

    if (scan.healthScore && scan.healthScore < 70) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'DISEASE_WARNING',
          title: 'Potential Disease Detected',
          body: `AI analysis of ${scan.plantName || 'your plant'} shows potential health issues. Check recommendations.`,
          data: { scanId: scan.id },
        },
      }).catch(() => {});
    }

    return scan;
  }

  async getScans(userId: string) {
    return this.prisma.aiScan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getScanById(id: string, userId: string) {
    return this.prisma.aiScan.findFirst({
      where: { id, userId },
    });
  }

  async analyzeGrowth(userId: string, cropId: string) {
    return this.visionAgent.analyzeGrowth(userId, cropId);
  }
}
