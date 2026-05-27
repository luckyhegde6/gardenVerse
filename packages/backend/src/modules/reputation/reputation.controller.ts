import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReputationService } from './reputation.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Reputation')
@Controller('reputation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('scores')
  @ApiOperation({ summary: 'Get reputation scores' })
  async getScores(@CurrentUser('id') userId: string) {
    return this.reputationService.getScores(userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get reputation history' })
  async getHistory(@CurrentUser('id') userId: string) {
    return this.reputationService.getHistory(userId);
  }

  @Get('invite-eligibility')
  @ApiOperation({ summary: 'Check invite eligibility' })
  async checkInviteEligibility(@CurrentUser('id') userId: string) {
    return this.reputationService.checkInviteEligibility(userId);
  }

  @Get('community-standing')
  @ApiOperation({ summary: 'Get community standing' })
  async getCommunityStanding(@CurrentUser('id') userId: string) {
    return this.reputationService.getCommunityStanding(userId);
  }
}
