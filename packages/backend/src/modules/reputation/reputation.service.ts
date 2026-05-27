import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { REPUTATION_ACTIONS } from '@/common/constants';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(private prisma: PrismaService) {}

  async getScores(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        trustScore: true,
        marketplaceReliability: true,
        communityStanding: true,
        reputationTokens: true,
        sustainabilityScore: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getHistory(userId: string) {
    return this.prisma.reputationLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateReputation(userId: string, action: string, scoreChange?: number, reason?: string) {
    const actionConfig = (REPUTATION_ACTIONS as any)[action];

    const delta = scoreChange ?? actionConfig?.score ?? 0;
    const desc = reason ?? actionConfig?.reason ?? action;

    await this.prisma.reputationLog.create({
      data: {
        userId,
        action,
        scoreChange: delta,
        reason: desc,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        trustScore: { increment: delta },
        communityStanding: { increment: delta * 0.5 },
        reputationTokens: { increment: delta * 2 },
      },
    });
  }

  async checkInviteEligibility(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        trustScore: true,
        level: true,
        inviteCount: true,
        isVerified: true,
      },
    });

    if (!user) return { eligible: false, reason: 'User not found' };

    const canInvite = user.isVerified && user.trustScore >= 50 && user.level >= 2;

    return {
      eligible: canInvite,
      trustScore: user.trustScore,
      level: user.level,
      inviteCount: user.inviteCount,
      reason: canInvite ? null : 'Need: verified account, trustScore >= 50, level >= 2',
    };
  }

  async getCommunityStanding(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { communityStanding: true },
    });

    return { communityStanding: user?.communityStanding ?? 0 };
  }

  async addGreenCredits(userId: string, amount: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { greenCredits: { increment: amount } },
    });
  }

  async deductGreenCredits(userId: string, amount: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { greenCredits: { decrement: amount } },
    });
  }
}
