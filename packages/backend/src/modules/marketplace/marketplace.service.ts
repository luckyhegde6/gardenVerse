import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  CreateListingDto,
  UpdateListingDto,
  ListingsQueryDto,
  PurchaseDto,
} from './dto/marketplace.dto';
import { MarketplaceAgent } from '@/agents/marketplace/marketplace-agent.service';

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    private marketplaceAgent: MarketplaceAgent,
  ) {}

  async createListing(userId: string, dto: CreateListingDto) {
    const listing = await this.marketplaceAgent.createListing(userId, {
      title: dto.title,
      description: dto.description,
      category: dto.category,
      price: dto.price,
      currency: dto.currency,
      quantity: dto.quantity,
      isLocal: dto.isLocal,
    });

    return this.prisma.marketplaceListing.findUnique({
      where: { id: listing.id },
      include: {
        seller: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, marketplaceReliability: true },
        },
      },
    });
  }

  async getListings(query: ListingsQueryDto) {
    const { category, search, location, minPrice, maxPrice, limit = 20, offset = 0 } = query;
    const where: any = { status: 'ACTIVE' };

    if (category) where.category = category;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const [items, total] = await Promise.all([
      this.prisma.marketplaceListing.findMany({
        where,
        include: {
          seller: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, marketplaceReliability: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.marketplaceListing.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async getListingById(id: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, marketplaceReliability: true },
        },
        transactions: {
          select: { id: true, status: true, amount: true, createdAt: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async updateListing(id: string, userId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) throw new ForbiddenException('Not your listing');
    if (listing.status !== 'ACTIVE') throw new BadRequestException('Listing is not active');

    return this.prisma.marketplaceListing.update({
      where: { id },
      data: dto,
    });
  }

  async deleteListing(id: string, userId: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) throw new ForbiddenException('Not your listing');

    return this.prisma.marketplaceListing.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async purchase(id: string, userId: string, _dto: PurchaseDto) {
    return this.marketplaceAgent.purchase(id, userId);
  }

  async getMyListings(userId: string) {
    return this.prisma.marketplaceListing.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: {
          select: { id: true, status: true, amount: true, createdAt: true },
        },
      },
    });
  }

  async getLocalFeed(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const listings = await this.prisma.marketplaceListing.findMany({
      where: {
        status: 'ACTIVE',
        sellerId: { not: userId },
        ...(user?.region ? { seller: { region: { contains: user.region } } } : {}),
      },
      include: {
        seller: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, marketplaceReliability: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return listings;
  }

  async cancelListing(id: string, userId: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) throw new ForbiddenException('Not your listing');
    if (listing.status !== 'ACTIVE') throw new BadRequestException('Listing is not active');

    return this.prisma.marketplaceListing.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getTransactionHistory(userId: string) {
    const [purchases, sales] = await Promise.all([
      this.prisma.marketplaceTransaction.findMany({
        where: { buyerId: userId },
        include: { listing: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.marketplaceTransaction.findMany({
        where: { sellerId: userId },
        include: { listing: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return { purchases, sales };
  }

  async raiseDispute(transactionId: string, userId: string, reason: string) {
    return this.marketplaceAgent.raiseDispute(transactionId, userId, reason);
  }
}
