import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TrackEventDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private eventStore: Array<{ userId: string; event: string; properties: any; timestamp: Date }> = [];

  constructor(private prisma: PrismaService) {
    setInterval(() => this.flushEvents(), 30000);
  }

  async trackEvent(userId: string, dto: TrackEventDto) {
    this.eventStore.push({
      userId,
      event: dto.event,
      properties: dto.properties,
      timestamp: new Date(),
    });

    return { tracked: true };
  }

  private async flushEvents() {
    if (this.eventStore.length === 0) return;

    const events = [...this.eventStore];
    this.eventStore = [];

    try {
      // Log events to audit log for persistence
      for (const event of events) {
        await this.prisma.auditLog.create({
          data: {
            action: `event:${event.event}`,
            entity: 'analytics',
            entityId: event.userId,
            changes: event.properties,
            userId: event.userId,
          },
        }).catch(() => {});
      }
      this.logger.log(`Flushed ${events.length} analytics events`);
    } catch (err) {
      this.logger.error('Failed to flush events', err);
    }
  }

  async getDauMau() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dau, mau] = await Promise.all([
      this.prisma.user.count({
        where: { lastActiveAt: { gte: todayStart } },
      }),
      this.prisma.user.count({
        where: { lastActiveAt: { gte: monthStart } },
      }),
    ]);

    return { dau, mau, date: todayStart.toISOString().split('T')[0] };
  }

  async getEngagementMetrics() {
    const totalUsers = await this.prisma.user.count();
    const totalGardens = await this.prisma.garden.count();
    const totalCrops = await this.prisma.crop.count();
    const totalListings = await this.prisma.marketplaceListing.count();
    const totalTransactions = await this.prisma.marketplaceTransaction.count();
    const totalMessages = await this.prisma.message.count();
    const totalGroups = await this.prisma.group.count();

    return {
      totalUsers,
      totalGardens,
      totalCrops,
      totalListings,
      totalTransactions,
      totalMessages,
      totalGroups,
      avgCropsPerGarden: totalGardens > 0 ? (totalCrops / totalGardens).toFixed(2) : 0,
      usersWithGardens: totalUsers > 0 ? ((totalGardens / totalUsers) * 100).toFixed(2) + '%' : '0%',
    };
  }

  async getRegionalActivity() {
    const regions = await this.prisma.user.groupBy({
      by: ['region'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    return regions.map((r: { region: string | null; _count: { id: number } }) => ({
      region: r.region || 'unknown',
      userCount: r._count.id,
    }));
  }
}
