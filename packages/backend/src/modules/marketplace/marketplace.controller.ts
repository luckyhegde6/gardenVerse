import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { CreateListingDto, UpdateListingDto, ListingsQueryDto, PurchaseDto } from './dto/marketplace.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '@/common/guards/optional-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @UseGuards(JwtAuthGuard)
  @Post('listings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a listing' })
  async createListing(@CurrentUser('id') userId: string, @Body() dto: CreateListingDto) {
    return this.marketplaceService.createListing(userId, dto);
  }

  @UseGuards(OptionalAuthGuard)
  @Get('listings')
  @ApiOperation({ summary: 'Get all listings' })
  async getListings(@Query() query: ListingsQueryDto) {
    return this.marketplaceService.getListings(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get local marketplace feed' })
  async getLocalFeed(@CurrentUser('id') userId: string) {
    return this.marketplaceService.getLocalFeed(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-listings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my listings' })
  async getMyListings(@CurrentUser('id') userId: string) {
    return this.marketplaceService.getMyListings(userId);
  }

  @UseGuards(OptionalAuthGuard)
  @Get('listings/:id')
  @ApiOperation({ summary: 'Get listing by ID' })
  async getListingById(@Param('id') id: string) {
    return this.marketplaceService.getListingById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('listings/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update listing' })
  async updateListing(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.marketplaceService.updateListing(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('listings/:id/purchase')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase a listing' })
  async purchase(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: PurchaseDto,
  ) {
    return this.marketplaceService.purchase(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('listings/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel listing' })
  async cancelListing(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.marketplaceService.cancelListing(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactionHistory(@CurrentUser('id') userId: string) {
    return this.marketplaceService.getTransactionHistory(userId);
  }
}
