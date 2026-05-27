import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TokenUtil } from '@/common/utils/token.util';
import { CreateInviteDto, RedeemInviteDto } from './dto/invite.dto';

@Injectable()
export class InviteSystemService {
  private readonly logger = new Logger(InviteSystemService.name);

  constructor(private prisma: PrismaService) {}

  async createInvite(userId: string, dto: CreateInviteDto) {
    const code = TokenUtil.generateInviteCode();

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

    const invite = await this.prisma.invite.create({
      data: {
        code,
        maxUses: dto.maxUses || 1,
        createdById: userId,
        expiresAt,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { inviteCount: { increment: 1 } },
    });

    return invite;
  }

  async redeemInvite(userId: string, dto: RedeemInviteDto) {
    const invite = await this.prisma.invite.findUnique({
      where: { code: dto.code },
      include: { createdBy: true },
    });

    if (!invite) throw new NotFoundException('Invalid invite code');
    if (!invite.isActive) throw new BadRequestException('Invite is no longer active');
    if (invite.useCount >= invite.maxUses) throw new BadRequestException('Invite has reached max uses');

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: { isActive: false },
      });
      throw new BadRequestException('Invite has expired');
    }

    if (invite.createdById === userId) {
      throw new BadRequestException('Cannot redeem your own invite');
    }

    await this.prisma.invite.update({
      where: { id: invite.id },
      data: {
        useCount: { increment: 1 },
        redeemedById: userId,
        redeemedAt: new Date(),
        isActive: invite.useCount + 1 >= invite.maxUses ? false : true,
      },
    });

    // Award XP to both users
    await this.prisma.user.update({
      where: { id: invite.createdById },
      data: { experience: { increment: 50 }, reputationTokens: { increment: 10 } },
    });

    return { message: 'Invite redeemed successfully', invitedBy: invite.createdBy.username };
  }

  async getMyInvites(userId: string) {
    return this.prisma.invite.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        redeemedBy: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });
  }

  async validateCode(code: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { code },
      select: {
        id: true,
        isActive: true,
        useCount: true,
        maxUses: true,
        expiresAt: true,
      },
    });

    if (!invite) return { valid: false, reason: 'Invalid code' };
    if (!invite.isActive) return { valid: false, reason: 'Invite is inactive' };
    if (invite.useCount >= invite.maxUses) return { valid: false, reason: 'Invite fully used' };
    if (invite.expiresAt && invite.expiresAt < new Date()) return { valid: false, reason: 'Invite expired' };

    return { valid: true, invite };
  }

  async getInviteById(id: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, username: true } },
        redeemedBy: { select: { id: true, username: true } },
      },
    });

    if (!invite) throw new NotFoundException('Invite not found');
    return invite;
  }
}
