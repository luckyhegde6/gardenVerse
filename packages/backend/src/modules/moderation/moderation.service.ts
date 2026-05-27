import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReportDto, ActionReportDto } from './dto/moderation.dto';
import { SafetyAgent } from '@/agents/safety/safety-agent.service';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private prisma: PrismaService,
    private safetyAgent: SafetyAgent,
  ) {}

  async createReport(reporterId: string, dto: CreateReportDto) {
    const { report, autoActioned, action } = await this.safetyAgent.createReport({
      type: dto.type,
      description: dto.description,
      evidence: dto.evidence,
      reporterId,
    });

    if (autoActioned) {
      this.logger.log(`Report auto-actioned: ${action}`);
    }

    return {
      ...report,
      autoActioned,
      action: autoActioned ? action : undefined,
      reporter: await this.prisma.user.findUnique({
        where: { id: reporterId },
        select: { id: true, username: true },
      }),
    };
  }

  async getReports(status?: string, limit = 20, offset = 0) {
    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      this.prisma.moderationReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          reporter: { select: { id: true, username: true } },
          actionedBy: { select: { id: true, username: true } },
        },
      }),
      this.prisma.moderationReport.count({ where }),
    ]);

    return { reports, total };
  }

  async getUserReports(userId: string) {
    return this.prisma.moderationReport.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        actionedBy: { select: { id: true, username: true } },
      },
    });
  }

  async actionReport(reportId: string, actionedById: string, dto: ActionReportDto) {
    const actionMap: Record<string, 'WARN' | 'SUSPEND' | 'BAN' | 'DISMISS'> = {
      RESOLVED: dto.actionTaken as any || 'WARN',
      DISMISSED: 'DISMISS',
    };

    const action = actionMap[dto.status] || 'WARN';

    return this.safetyAgent.takeAction(reportId, actionedById, action, dto.actionTaken || 'Moderator action');
  }
}
