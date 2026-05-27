import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BaseAgent } from '../base-agent.service';
import { AgentOrchestrator } from '../agent-orchestrator.service';
import { AgentName, AgentEvent, EVENT_TYPES, AGENT_CONFIGS } from '../types/agent.types';

@Injectable()
export class MarketplaceAgent extends BaseAgent {
  protected readonly agentName = AgentName.MARKETPLACE;
  protected readonly agentVersion = '1.0.0';
  protected readonly eventSubscriptions = [
    EVENT_TYPES.CROP_HARVESTED,
    EVENT_TYPES.TRADE_COMPLETE,
  ];
  protected readonly eventEmissions = [
    EVENT_TYPES.LISTING_CREATED,
    EVENT_TYPES.TRADE_COMPLETE,
    EVENT_TYPES.DISPUTE_RAISED,
  ];

  private readonly PLATFORM_FEE_PERCENT = 2;
  private readonly ESCROW_DURATION_HOURS = 48;

  constructor(
    orchestrator: AgentOrchestrator,
    private prisma: PrismaService,
  ) {
    super(orchestrator);
    this.logger = new Logger(MarketplaceAgent.name);
    this.config = AGENT_CONFIGS[AgentName.MARKETPLACE];
  }

  async onEvent(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case EVENT_TYPES.CROP_HARVESTED:
        await this.handleHarvestForAutoListing(event);
        break;
    }
  }

  async createListing(
    userId: string,
    data: {
      title: string;
      description?: string;
      category: string;
      price: number;
      currency?: string;
      quantity?: number;
      isLocal?: boolean;
    },
  ) {
    const seller = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!seller) throw new Error('User not found');

    const listing = await this.prisma.marketplaceListing.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        currency: data.currency || 'GREEN_CREDITS',
        quantity: data.quantity || 1,
        sellerId: userId,
        isLocal: data.isLocal || false,
      },
    });

    await this.emit(EVENT_TYPES.LISTING_CREATED, {
      listingId: listing.id,
      sellerId: userId,
      title: data.title,
      category: data.category,
      price: data.price,
    });

    return listing;
  }

  async purchase(listingId: string, buyerId: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });

    if (!listing) throw new Error('Listing not found');
    if (listing.status !== 'ACTIVE') throw new Error('Listing is not active');
    if (listing.sellerId === buyerId) throw new Error('Cannot purchase your own listing');

    const buyer = await this.prisma.user.findUnique({ where: { id: buyerId } });
    if (!buyer) throw new Error('Buyer not found');

    const priceInCredits = listing.currency === 'GREEN_CREDITS' ? listing.price : listing.price;
    if (buyer.greenCredits < priceInCredits) throw new Error('Insufficient Green Credits');

    const fee = Math.floor(priceInCredits * (this.PLATFORM_FEE_PERCENT / 100));
    const sellerAmount = priceInCredits - fee;

    const [transaction] = await this.prisma.$transaction([
      this.prisma.marketplaceTransaction.create({
        data: {
          status: 'COMPLETED',
          amount: priceInCredits,
          currency: listing.currency,
          listingId,
          buyerId,
          sellerId: listing.sellerId,
        },
      }),
      this.prisma.user.update({
        where: { id: buyerId },
        data: { greenCredits: { decrement: priceInCredits } },
      }),
      this.prisma.user.update({
        where: { id: listing.sellerId },
        data: { greenCredits: { increment: sellerAmount } },
      }),
      this.prisma.marketplaceListing.update({
        where: { id: listingId },
        data: { status: 'SOLD' },
      }),
    ]);

    await this.emit(EVENT_TYPES.TRADE_COMPLETE, {
      transactionId: transaction.id,
      listingId,
      buyerId,
      sellerId: listing.sellerId,
      amount: priceInCredits,
      currency: listing.currency,
      timestamp: new Date().toISOString(),
    });

    return transaction;
  }

  async raiseDispute(transactionId: string, userId: string, reason: string) {
    const transaction = await this.prisma.marketplaceTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new Error('Not a party to this transaction');
    }

    await this.prisma.marketplaceTransaction.update({
      where: { id: transactionId },
      data: { status: 'DISPUTED' },
    });

    await this.emit(EVENT_TYPES.DISPUTE_RAISED, {
      transactionId,
      listingId: transaction.listingId,
      raisedBy: userId,
      reason,
      timestamp: new Date().toISOString(),
    });

    return { message: 'Dispute raised, moderator will review' };
  }

  private async handleHarvestForAutoListing(event: AgentEvent) {
    const payload = event.payload as { userId: string; cropId: string; yield: number; quality: number };
    const crop = await this.prisma.crop.findFirst({
      where: { id: payload.cropId },
      include: { garden: true },
    });

    if (!crop || payload.quality < 50) return;

    await this.prisma.inventory.create({
      data: {
        userId: payload.userId,
        itemType: 'HARVEST',
        itemId: `harvest-${crop.id}`,
        name: `${crop.name} Harvest`,
        quantity: Math.max(1, Math.floor(payload.yield)),
        rarity: payload.quality > 80 ? 'RARE' : payload.quality > 60 ? 'UNCOMMON' : 'COMMON',
      },
    });
  }
}
