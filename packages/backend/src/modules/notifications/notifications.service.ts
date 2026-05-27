import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount, page, limit };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async createNotification(userId: string, type: string, title: string, body: string, data?: any) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, data: data || undefined },
    });

    return notification;
  }

  async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    // FCM push notification send logic would go here
    this.logger.log(`Push notification to ${userId}: ${title} - ${body}`);

    await this.createNotification(userId, 'PUSH', title, body, data);
  }

  async deleteOldNotifications(daysOld = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
  }
}
