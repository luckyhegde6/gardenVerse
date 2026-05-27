import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  UpdateProfileDto,
  UpdateAvatarDto,
  LeaderboardQueryDto,
  UserSearchDto,
} from './dto/user.dto';
import { UserProfile, UserStats, LeaderboardEntry } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isVerified: true,
        isOnboarded: true,
        region: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getProfileByUsername(username: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isVerified: true,
        isOnboarded: true,
        region: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isVerified: true,
        isOnboarded: true,
        region: true,
        createdAt: true,
      },
    });

    return user;
  }

  async updateAvatar(userId: string, dto: UpdateAvatarDto): Promise<UserProfile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: dto.avatarUrl },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isVerified: true,
        isOnboarded: true,
        region: true,
        createdAt: true,
      },
    });

    return user;
  }

  async getStats(userId: string): Promise<UserStats> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        level: true,
        experience: true,
        currentStreak: true,
        longestStreak: true,
        greenCredits: true,
        ecoPoints: true,
        reputationTokens: true,
        sustainabilityScore: true,
        trustScore: true,
        marketplaceReliability: true,
        communityStanding: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getLeaderboard(query: LeaderboardQueryDto): Promise<{ entries: LeaderboardEntry[]; total: number }> {
    const { region, limit = 20, offset = 0 } = query;

    const where = region ? { region } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { experience: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          level: true,
          experience: true,
          sustainabilityScore: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const entries: LeaderboardEntry[] = users.map((user: any, index: number) => ({
      rank: offset + index + 1,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      level: user.level,
      experience: user.experience,
      sustainabilityScore: user.sustainabilityScore,
    }));

    return { entries, total };
  }

  async searchUsers(query: UserSearchDto): Promise<{ users: UserProfile[]; total: number }> {
    const { query: searchQuery, region, limit = 20, offset = 0 } = query;

    const where: any = {};

    if (searchQuery) {
      where.OR = [
        { username: { contains: searchQuery, mode: 'insensitive' } },
        { displayName: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    if (region) {
      where.region = region;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          role: true,
          isVerified: true,
          isOnboarded: true,
          region: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }
}
