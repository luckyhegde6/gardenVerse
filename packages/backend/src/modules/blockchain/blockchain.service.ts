import { Injectable, Logger } from '@nestjs/common';
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
