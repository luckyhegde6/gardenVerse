import { Injectable, Logger, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { TokenUtil } from '@/common/utils/token.util';
import { AdminRegisterDto, AdminLoginDto, AdminUserQueryDto, UpdateUserRoleDto, BlockUserDto, AdminResetPasswordDto, CreateSupportTicketDto, UpdateTicketStatusDto, AssignTicketDto, SupportTicketQueryDto } from './dto/admin.dto';
import { CreateAdminInviteDto, TokenTransactionQueryDto, AppLogQueryDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async registerSuperAdmin(dto: AdminRegisterDto) {
    const expectedCode = this.configService.get('SUPER_ADMIN_REGISTRATION_CODE');
    if (!expectedCode || dto.registrationCode !== expectedCode) {
      throw new ForbiddenException('Invalid super admin registration code');
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) throw new ConflictException('Email or username already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: 'Super Admin',
        passwordHash,
        role: 'SUPER_ADMIN',
        isVerified: true,
      },
    });

    this.logger.warn(`Super admin created: ${user.email} (${user.id})`);
    return { message: 'Super admin registered', userId: user.id };
  }

  async loginSuperAdmin(dto: AdminLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, username: true, passwordHash: true, role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET', 'default-secret'),
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'default-refresh-secret'),
      expiresIn: '7d',
    });

    await this.prisma.session.create({
      data: {
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
      },
    });

    return { accessToken, refreshToken, expiresIn: 900, user: { id: user.id, email: user.email, role: user.role } };
  }

  async getDashboardStats() {
    const [
      totalUsers, verifiedUsers, totalGardens, totalCrops,
      activeListings, completedTransactions, reportsPending, activeSessions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.garden.count(),
      this.prisma.crop.count(),
      this.prisma.marketplaceListing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.marketplaceTransaction.count({ where: { status: 'COMPLETED' } }),
      this.prisma.moderationReport.count({ where: { status: 'PENDING' } }),
      this.prisma.session.count({ where: { isRevoked: false, expiresAt: { gt: new Date() } } }),
    ]);

    const revenue = await this.prisma.marketplaceTransaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });

    return {
      totalUsers, verifiedUsers,
      verificationRate: totalUsers > 0 ? `${((verifiedUsers / totalUsers) * 100).toFixed(1)}%` : '0%',
      totalGardens, totalCrops, activeListings, completedTransactions,
      totalRevenue: revenue._sum.amount || 0,
      reportsPending, activeSessions,
    };
  }

  async getUsers(query: AdminUserQueryDto) {
    const { search, role, limit = 20, offset = 0 } = query;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' as const } },
        { username: { contains: search, mode: 'insensitive' as const } },
        { displayName: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset,
        select: {
          id: true, email: true, username: true, displayName: true,
          role: true, isVerified: true, isOnboarded: true,
          level: true, trustScore: true, greenCredits: true, ecoPoints: true,
          createdAt: true, lastActiveAt: true,
          _count: { select: { crops: true, listings: true, notifications: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, limit, offset };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, username: true, displayName: true, role: true,
        isVerified: true, isOnboarded: true, avatarUrl: true, bio: true,
        level: true, experience: true, greenCredits: true, ecoPoints: true,
        reputationTokens: true, trustScore: true, sustainabilityScore: true,
        createdAt: true, lastActiveAt: true, region: true,
        _count: { select: { crops: true, listings: true, notifications: true } },
      },
    });
    if (!user) throw new BadRequestException('User not found');
    return user;
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: { id: true, email: true, username: true, role: true },
    });
    this.logger.log(`User ${userId} role updated to ${dto.role}`);
    return user;
  }

  async deleteUser(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });
    return { message: 'User soft-deleted' };
  }

  async getSystemHealth() {
    const dbConnected = await this.prisma.$queryRaw`SELECT 1 as ok`.then(() => true).catch(() => false);
    const [userCount, activeSessions, pendingTxs, recentErrors] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.session.count({ where: { isRevoked: false, expiresAt: { gt: new Date() } } }),
      this.prisma.blockchainTransaction.count({ where: { status: 'PENDING' } }),
      this.prisma.appLog.count({ where: { level: 'ERROR', createdAt: { gte: new Date(Date.now() - 3600000) } } }),
    ]);

    return {
      status: dbConnected ? 'healthy' : 'degraded',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      metrics: { totalUsers: userCount, activeSessions, pendingBlockchainTxs: pendingTxs, errorsLastHour: recentErrors },
    };
  }

  async getPerformanceMetrics() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [errors, slowQueries, activeUsers, dau, mau] = await Promise.all([
      this.prisma.appLog.count({ where: { level: 'ERROR', createdAt: { gte: hourAgo } } }),
      this.prisma.appLog.count({ where: { level: 'WARN', createdAt: { gte: hourAgo } } }),
      this.prisma.session.count({ where: { isRevoked: false, expiresAt: { gt: now } } }),
      this.prisma.user.count({ where: { lastActiveAt: { gte: today } } }),
      this.prisma.user.count({ where: { lastActiveAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
    ]);

    const responseTime = await this.prisma.appLog.findMany({
      where: { context: 'response_time', createdAt: { gte: hourAgo } },
      orderBy: { createdAt: 'desc' }, take: 100,
    });

    const avgResponseTime = responseTime.length > 0
      ? responseTime.reduce((sum, log) => sum + ((log.metadata as any)?.duration || 0), 0) / responseTime.length
      : 0;

    return {
      uptime: process.uptime(),
      activeSessions: activeUsers,
      dau, mau,
      errorsLastHour: errors,
      warningsLastHour: slowQueries,
      avgResponseTimeMs: Math.round(avgResponseTime),
      timestamp: now.toISOString(),
    };
  }

  async getTokenTransactions(query: TokenTransactionQueryDto) {
    const { userId, type, limit = 50, offset = 0 } = query;
    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      this.prisma.tokenTransaction.findMany({
        where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset,
        include: { user: { select: { id: true, username: true, email: true } } },
      }),
      this.prisma.tokenTransaction.count({ where }),
    ]);

    return { transactions, total, limit, offset };
  }

  async getAppLogs(query: AppLogQueryDto) {
    const { level, source, search, limit = 50, offset = 0 } = query;
    const where: any = {};
    if (level) where.level = level;
    if (source) where.source = source;
    if (search) where.message = { contains: search, mode: 'insensitive' as const };

    const [logs, total] = await Promise.all([
      this.prisma.appLog.findMany({
        where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset,
      }),
      this.prisma.appLog.count({ where }),
    ]);

    return { logs, total, limit, offset };
  }

  async getInvites() {
    return this.prisma.invite.findMany({
      orderBy: { createdAt: 'desc' }, take: 100,
      include: {
        createdBy: { select: { id: true, username: true } },
        redeemedBy: { select: { id: true, username: true } },
      },
    });
  }

  async createInvite(adminId: string, dto: CreateAdminInviteDto) {
    let expiresAt: Date | undefined;
    if (dto.expiresIn) {
      expiresAt = new Date();
      const match = dto.expiresIn.match(/^(\d+)([dh])$/);
      if (match) {
        const num = parseInt(match[1]);
        if (match[2] === 'd') expiresAt.setDate(expiresAt.getDate() + num);
        if (match[2] === 'h') expiresAt.setHours(expiresAt.getHours() + num);
      }
    }

    const code = TokenUtil.generateInviteCode();
    const passcode = dto.requirePasscode ? (dto.passcode || TokenUtil.generatePasscode()) : null;

    const invite = await this.prisma.invite.create({
      data: {
        code, type: dto.requirePasscode ? 'PASSCODE' : 'CODE',
        passcode, maxUses: dto.maxUses || 10,
        createdById: adminId, expiresAt,
      },
    });

    const inviteLink = `${this.configService.get('NEXT_PUBLIC_API_URL', 'http://localhost:3000')}/auth/register?code=${code}`;

    return { ...invite, inviteLink, passcode };
  }

  async revokeInvite(inviteId: string) {
    const invite = await this.prisma.invite.update({
      where: { id: inviteId },
      data: { isActive: false },
    });
    return invite;
  }

  async blockUser(userId: string, dto: BlockUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, username: true, isBlocked: true } });
    if (!user) throw new BadRequestException('User not found');
    if (user.isBlocked) throw new BadRequestException('User is already blocked');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true, blockedAt: new Date(), blockedReason: dto.reason },
    });

    await this.prisma.notification.create({
      data: {
        type: 'SUPPORT_TICKET',
        title: 'Account Blocked',
        body: `Your account has been blocked. Reason: ${dto.reason}. Contact support if you believe this is an error.`,
        userId,
      },
    });

    this.logger.warn(`User ${user.email} (${userId}) blocked. Reason: ${dto.reason}`);
    return { message: 'User blocked successfully' };
  }

  async unblockUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, username: true, isBlocked: true } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.isBlocked) throw new BadRequestException('User is not blocked');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false, blockedAt: null, blockedReason: null },
    });

    await this.prisma.notification.create({
      data: {
        type: 'SUPPORT_TICKET',
        title: 'Account Unblocked',
        body: `Your account has been unblocked. You can now log in and use GardenVerse normally.`,
        userId,
      },
    });

    this.logger.log(`User ${user.email} (${userId}) unblocked`);
    return { message: 'User unblocked successfully' };
  }

  async resetUserPassword(userId: string, dto: AdminResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    if (!user) throw new BadRequestException('User not found');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.warn(`Password reset by admin for user ${user.email} (${userId})`);
    return { message: 'Password reset successfully' };
  }

  async getSupportTickets(query: SupportTicketQueryDto) {
    const { status, limit = 50, offset = 0 } = query;
    const where: any = {};
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset,
        include: {
          user: { select: { id: true, username: true, email: true } },
          assignedTo: { select: { id: true, username: true, email: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return { tickets, total, limit, offset };
  }

  async updateTicketStatus(ticketId: string, dto: UpdateTicketStatusDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new BadRequestException('Ticket not found');

    const updateData: any = { status: dto.status };
    if (dto.adminNotes !== undefined) updateData.adminNotes = dto.adminNotes;
    if (dto.status === 'CLOSED' || dto.status === 'RESOLVED') updateData.closedAt = new Date();

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId }, data: updateData,
      include: {
        user: { select: { id: true, username: true, email: true } },
        assignedTo: { select: { id: true, username: true, email: true } },
      },
    });

    await this.prisma.notification.create({
      data: {
        type: 'SUPPORT_TICKET',
        title: `Support Ticket ${dto.status === 'CLOSED' ? 'Closed' : 'Updated'}`,
        body: `Your support ticket "${ticket.subject}" has been updated to ${dto.status}.${dto.adminNotes ? ` Notes: ${dto.adminNotes}` : ''}`,
        userId: ticket.userId,
      },
    });

    return updated;
  }

  async assignTicket(ticketId: string, dto: AssignTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new BadRequestException('Ticket not found');

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedToId: dto.assignedToId, status: 'IN_PROGRESS' },
      include: {
        user: { select: { id: true, username: true, email: true } },
        assignedTo: { select: { id: true, username: true, email: true } },
      },
    });
    return updated;
  }

  async createSupportTicket(userId: string, dto: CreateSupportTicketDto) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        subject: dto.subject,
        message: dto.message,
        status: 'OPEN',
        userId,
      },
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    });

    this.logger.log(`Support ticket created by user ${userId}: ${ticket.subject}`);
    return ticket;
  }

  async getAdminNotifications(userId: string, limit = 20) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId, type: 'SUPPORT_TICKET' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const unreadCount = await this.prisma.notification.count({
      where: { userId, type: 'SUPPORT_TICKET', isRead: false },
    });
    return { notifications, unreadCount };
  }

  async getOpenTicketCount() {
    return this.prisma.supportTicket.count({ where: { status: { notIn: ['CLOSED', 'RESOLVED'] } } });
  }
}
