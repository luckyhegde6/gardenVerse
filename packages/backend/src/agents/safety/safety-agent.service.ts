import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { BaseAgent } from '../base-agent.service';
import { AgentOrchestrator } from '../agent-orchestrator.service';
import { AgentName, AgentEvent, EVENT_TYPES, AGENT_CONFIGS } from '../types/agent.types';

@Injectable()
export class SafetyAgent extends BaseAgent {
  protected readonly agentName = AgentName.SAFETY;
  protected readonly agentVersion = '1.0.0';
  protected readonly eventSubscriptions = [
    EVENT_TYPES.REPORT_CREATED,
    EVENT_TYPES.DISPUTE_RAISED,
  ];
  protected readonly eventEmissions = [
    EVENT_TYPES.ACTION_TAKEN,
    EVENT_TYPES.USER_RESTRICTED,
  ];

  private readonly TOXIC_PATTERNS = [
    /scam/i, /spam/i, /(buy|sell)\s+(followers|likes)/i,
    /phishing/i, /free\s+(money|crypto|bitcoin)/i,
    /click\s+here/i, /http(s)?:\/\/bit\.ly/i,
  ];
  private readonly PROFANITY_LIST = ['badword1', 'badword2'];

  constructor(
    orchestrator: AgentOrchestrator,
    private prisma: PrismaService,
  ) {
    super(orchestrator);
    this.logger = new Logger(SafetyAgent.name);
    this.config = AGENT_CONFIGS[AgentName.SAFETY];
  }

  async onEvent(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case EVENT_TYPES.REPORT_CREATED:
        await this.handleReport(event);
        break;
      case EVENT_TYPES.DISPUTE_RAISED:
        await this.handleDisputeEscalation(event);
        break;
    }
  }

  async analyzeContent(content: string, authorId: string): Promise<{ isFlagged: boolean; reasons: string[]; severity: string }> {
    const reasons: string[] = [];
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    for (const pattern of this.TOXIC_PATTERNS) {
      if (pattern.test(content)) {
        reasons.push('Suspected spam content');
        severity = 'HIGH';
        break;
      }
    }

    for (const word of this.PROFANITY_LIST) {
      if (content.toLowerCase().includes(word)) {
        reasons.push('Inappropriate language detected');
        if (severity !== 'HIGH') severity = 'MEDIUM';
        break;
      }
    }

    if (content.length > 1000) {
      reasons.push('Excessive message length');
    }

    const recentReports = await this.prisma.moderationReport.count({
      where: { reporterId: authorId, createdAt: { gte: new Date(Date.now() - 3600000) } },
    });
    if (recentReports > 10) {
      reasons.push('Report spam — excessive reporting');
      severity = 'HIGH';
    }

    return { isFlagged: reasons.length > 0, reasons, severity };
  }

  async createReport(data: {
    type: string;
    description?: string;
    evidence?: any;
    reporterId: string;
    targetUserId?: string;
  }) {
    const report = await this.prisma.moderationReport.create({
      data: {
        type: data.type,
        description: data.description,
        evidence: data.evidence || {},
        reporterId: data.reporterId,
        status: 'PENDING',
      },
    });

    if (this.shouldAutoModerate(data.type, data.description)) {
      const action = await this.autoModerate(report.id, data);
      await this.emit(EVENT_TYPES.ACTION_TAKEN, {
        reportId: report.id,
        targetUserId: data.targetUserId || '',
        actionType: action,
        reason: 'Auto-moderated based on severity',
        actionedBy: 'safety-agent',
      });
      return { report, autoActioned: true, action };
    }

    await this.emit(EVENT_TYPES.REPORT_CREATED, {
      reportId: report.id,
      type: data.type,
      reporterId: data.reporterId,
    });

    return { report, autoActioned: false };
  }

  async takeAction(
    reportId: string,
    actionedBy: string,
    action: 'WARN' | 'SUSPEND' | 'BAN' | 'DISMISS',
    reason: string,
  ) {
    const report = await this.prisma.moderationReport.update({
      where: { id: reportId },
      data: {
        status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
        actionedById: actionedBy,
        actionTaken: action,
        resolvedAt: new Date(),
      },
    });

    if (action === 'SUSPEND' || action === 'BAN') {
      const suspendDays = action === 'BAN' ? 365 : 7;
      const restrictedUntil = new Date();
      restrictedUntil.setDate(restrictedUntil.getDate() + suspendDays);

      await this.emit(EVENT_TYPES.USER_RESTRICTED, {
        targetUserId: report.reporterId,
        actionType: action,
        reason,
        duration: `${suspendDays}d`,
        actionedBy,
      });
    }

    await this.emit(EVENT_TYPES.ACTION_TAKEN, {
      reportId,
      targetUserId: report.reporterId,
      actionType: action,
      reason,
      actionedBy,
    });

    return report;
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async reviewFlaggedContent() {
    this.logger.log('Safety Agent: reviewing flagged content...');
    const pendingReports = await this.prisma.moderationReport.findMany({
      where: { status: 'PENDING', createdAt: { lt: new Date(Date.now() - 86400000) } },
    });

    for (const report of pendingReports) {
      if (this.shouldAutoModerate(report.type, report.description || undefined)) {
        const action = await this.autoModerate(report.id, { type: report.type, description: report.description || undefined });
        this.logger.log(`Auto-moderated report ${report.id}: ${action}`);
      }
    }
  }

  private async handleReport(event: AgentEvent) {
    this.logger.log(`Processing report: ${event.id}`);
  }

  private async handleDisputeEscalation(event: AgentEvent) {
    const payload = event.payload as { transactionId: string; reason: string; raisedBy: string };
    this.logger.log(`Dispute escalated: ${payload.transactionId} — ${payload.reason}`);
  }

  private shouldAutoModerate(type: string, description?: string): boolean {
    if (type === 'SPAM' || type === 'ABUSE') return true;
    if (description && this.TOXIC_PATTERNS.some((p) => p.test(description))) return true;
    return false;
  }

  private async autoModerate(reportId: string, data: { type: string; description?: string }): Promise<'WARN' | 'SUSPEND' | 'DISMISS'> {
    if (data.type === 'SPAM') return 'WARN';
    if (data.type === 'ABUSE' && data.description && this.TOXIC_PATTERNS.some((p) => p.test(data.description!))) {
      return 'SUSPEND';
    }
    return 'DISMISS';
  }
}
