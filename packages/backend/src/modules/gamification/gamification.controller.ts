import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { CreateHybridDto, AwardXPDto } from './dto/gamification.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get full plant-centric gamification data' })
  async getGamification(@CurrentUser('id') userId: string) {
    return this.gamificationService.getFullGamificationData(userId);
  }

  @Get('collections')
  @ApiOperation({ summary: 'Get user plant collections' })
  async getCollections(@CurrentUser('id') userId: string) {
    return this.gamificationService.getUserCollections(userId);
  }

  @Get('collections/stats')
  @ApiOperation({ summary: 'Get collection stats' })
  async getCollectionStats(@CurrentUser('id') userId: string) {
    return this.gamificationService.getCollectionStats(userId);
  }

  @Post('species/:id/discover')
  @ApiOperation({ summary: 'Discover a plant species' })
  async discoverSpecies(@CurrentUser('id') userId: string, @Param('id') speciesId: string) {
    return this.gamificationService.discoverSpecies(userId, speciesId);
  }

  @Get('mastery/:speciesId')
  @ApiOperation({ summary: 'Get species mastery for a specific species' })
  async getSpeciesMastery(@CurrentUser('id') userId: string, @Param('speciesId') speciesId: string) {
    return this.gamificationService.getSpeciesMastery(userId, speciesId);
  }

  @Get('masteries')
  @ApiOperation({ summary: 'Get all species masteries' })
  async getAllMasteries(@CurrentUser('id') userId: string) {
    return this.gamificationService.getAllMasteries(userId);
  }

  @Post('hybrid')
  @ApiOperation({ summary: 'Create a new plant hybrid' })
  async createHybrid(@CurrentUser('id') userId: string, @Body() dto: CreateHybridDto) {
    return this.gamificationService.createHybrid(userId, dto.parent1Id, dto.parent2Id);
  }

  @Get('hybrids')
  @ApiOperation({ summary: 'Get user created hybrids' })
  async getHybrids(@CurrentUser('id') userId: string) {
    return this.gamificationService.getUserHybrids(userId);
  }

  @Post('crop/:id/care')
  @ApiOperation({ summary: 'Update care streak for a crop' })
  async updateCareStreak(@CurrentUser('id') userId: string, @Param('id') cropId: string) {
    return this.gamificationService.updateCareStreak(cropId, userId);
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get all available achievements with user progress' })
  async getAchievements(@CurrentUser('id') userId: string) {
    return this.gamificationService.getAchievements(userId);
  }

  @Post('xp')
  @ApiOperation({ summary: 'Award XP to user' })
  async awardXP(@CurrentUser('id') userId: string, @Body() dto: AwardXPDto) {
    return this.gamificationService.awardXP(userId, dto.amount);
  }
}
