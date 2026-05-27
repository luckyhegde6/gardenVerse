import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { SubmitScanDto, AiRecommendationDto } from './dto/ai.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RecommendationAgent } from '@/agents/recommendation/recommendation-agent.service';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly recommendationAgent: RecommendationAgent,
  ) {}

  @Post('scan')
  @ApiOperation({ summary: 'Submit a plant scan' })
  async submitScan(@CurrentUser('id') userId: string, @Body() dto: SubmitScanDto) {
    return this.aiService.submitScan(userId, dto);
  }

  @Get('scans')
  @ApiOperation({ summary: 'Get scan history' })
  async getScanHistory(@CurrentUser('id') userId: string) {
    return this.aiService.getScans(userId);
  }

  @Get('scans/:id')
  @ApiOperation({ summary: 'Get scan by ID' })
  async getScanById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.aiService.getScanById(id, userId);
  }

  @Get('recommendations/watering')
  @ApiOperation({ summary: 'Get watering recommendations' })
  async getWateringRecs(
    @CurrentUser('id') userId: string,
    @Query('cropId') cropId?: string,
  ) {
    return this.recommendationAgent.getWateringRecommendation(userId, cropId);
  }

  @Get('recommendations/fertilizer')
  @ApiOperation({ summary: 'Get fertilizer recommendations' })
  async getFertilizerRecs(
    @CurrentUser('id') userId: string,
    @Query('cropId') cropId?: string,
  ) {
    return this.recommendationAgent.getFertilizerRecommendation(userId, cropId);
  }

  @Get('recommendations/crops')
  @ApiOperation({ summary: 'Get crop recommendations for a region' })
  async getCropRecs(
    @Query('region') region: string,
    @Query('season') season?: string,
  ) {
    return this.recommendationAgent.getCropRecommendation(region, season);
  }

  @Get('recommendations/sustainability')
  @ApiOperation({ summary: 'Get sustainability tips' })
  async getSustainabilityTips(@CurrentUser('id') userId: string) {
    return this.recommendationAgent.getSustainabilityTips(userId);
  }

  @Get('growth/:cropId')
  @ApiOperation({ summary: 'Analyze crop growth' })
  async analyzeGrowth(
    @CurrentUser('id') userId: string,
    @Param('cropId') cropId: string,
  ) {
    return this.aiService.analyzeGrowth(userId, cropId);
  }
}
