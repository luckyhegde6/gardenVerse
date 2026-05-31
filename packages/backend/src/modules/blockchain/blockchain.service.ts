import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RecordTransactionDto } from './dto/blockchain.dto';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(private prisma: PrismaService) {}

  async recordTransaction(userId: string, dto: RecordTransactionDto) {
    const tx = await this.prisma.blockchainTransaction.create({
      data: {
        userId,
        contractType: dto.contractType,
        action: dto.action,
        fromAddress: dto.fromAddress,
        toAddress: dto.toAddress,
        amount: dto.amount,
        tokenId: dto.tokenId,
      },
    });

    this.logger.log(`Blockchain tx recorded: ${tx.id}`);
    return tx;
  }

  /**
   * Award genesis tokens to a new user (1000 GREEN_CREDITS at level 1).
   */
  async awardGenesisTokens(userId: string, email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, greenCredits: true, level: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const balanceBefore = user.greenCredits;
    const amount = 1000;
    const balanceAfter = balanceBefore + amount;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { greenCredits: { increment: amount } },
      }),
      this.prisma.tokenTransaction.create({
        data: {
          userId,
          type: 'GREEN_CREDITS',
          amount,
          balanceBefore,
          balanceAfter,
          action: 'GENESIS_AWARD',
          description: 'Welcome to GardenVerse! 1000 initial tokens',
        },
      }),
    ]);

    this.logger.log(`Genesis tokens awarded to user ${userId} (${email}): 1000 GREEN_CREDITS`);
  }

  /**
   * Record any token transaction.
   */
  async recordTokenTransaction(params: {
    userId: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    action: string;
    description?: string;
    referenceId?: string;
    referenceType?: string;
  }): Promise<void> {
    const { userId, type, amount, balanceBefore, balanceAfter, action, description, referenceId, referenceType } = params;

    await this.prisma.tokenTransaction.create({
      data: {
        userId,
        type: type as any,
        amount,
        balanceBefore,
        balanceAfter,
        action,
        description,
        referenceId,
        referenceType,
      },
    });

    this.logger.log(`Token transaction recorded: ${action} for user ${userId}`);
  }

  /**
   * Sync genesis tokens for existing level-1 users with 0 greenCredits.
   */
  async syncGenesisTokensForExistingUsers(): Promise<{ count: number }> {
    const users = await this.prisma.user.findMany({
      where: {
        level: 1,
        greenCredits: 0,
        deletedAt: null,
      },
      select: { id: true, email: true, greenCredits: true },
    });

    if (users.length === 0) {
      return { count: 0 };
    }

    let updatedCount = 0;

    for (const user of users) {
      const balanceBefore = user.greenCredits;
      const amount = 1000;
      const balanceAfter = balanceBefore + amount;

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: { greenCredits: { increment: amount } },
        }),
        this.prisma.tokenTransaction.create({
          data: {
            userId: user.id,
            type: 'GREEN_CREDITS',
            amount,
            balanceBefore,
            balanceAfter,
            action: 'GENESIS_AWARD',
            description: 'Welcome to GardenVerse! 1000 initial tokens',
          },
        }),
      ]);

      updatedCount++;
    }

    this.logger.log(`Genesis tokens synced for ${updatedCount} existing users`);
    return { count: updatedCount };
  }

  async getTransactionHistory(userId: string) {
    return this.prisma.blockchainTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyTransaction(txId: string) {
    const tx = await this.prisma.blockchainTransaction.findUnique({
      where: { id: txId },
    });

    if (!tx) return null;

    // In production, would verify on-chain
    return {
      ...tx,
      verified: true,
      message: 'Transaction recorded for future on-chain verification',
    };
  }

  async getByHash(txHash: string) {
    return this.prisma.blockchainTransaction.findUnique({
      where: { txHash },
    });
  }

  async confirmTransaction(txId: string, txHash: string, blockNumber: number) {
    return this.prisma.blockchainTransaction.update({
      where: { id: txId },
      data: {
        txHash,
        blockNumber,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });
  }

  async getPendingTransactions() {
    return this.prisma.blockchainTransaction.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  }
}
