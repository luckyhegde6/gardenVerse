import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlantsService } from './plants.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Plants')
@Controller('plants')
@UseGuards(JwtAuthGuard)
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search plants by name from public datasets + local DB' })
  async searchPlants(@Query('q') query: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.plantsService.searchPlants(query, Number(page), Number(limit));
  }

  @Public()
  @Get('by-season')
  @ApiOperation({ summary: 'Get plants suitable for a season' })
  async getBySeason(@Query('season') season: string, @Query('difficulty') difficulty?: string) {
    return this.plantsService.getPlantsBySeason(season, difficulty);
  }

  @Get('recommended/:gardenId')
  @ApiOperation({ summary: 'Get recommended plants for a garden' })
  async getRecommended(@Param('gardenId') gardenId: string) {
    return this.plantsService.getRecommendedPlants(gardenId);
  }

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get public garden plan templates' })
  async getPlans(@Query('season') season?: string, @Query('difficulty') difficulty?: string) {
    return this.plantsService.getGardenPlanTemplates(season, difficulty);
  }

  @Public()
  @Get('plans/:id')
  @ApiOperation({ summary: 'Get garden plan template by id' })
  async getPlanById(@Param('id') id: string) {
    return this.plantsService.getGardenPlanById(id);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a garden plan' })
  async createPlan(@Body() body: {
    name: string; description?: string; season?: string;
    gridWidth?: number; gridHeight?: number;
    plants: Array<{ speciesId: string; plotX: number; plotY: number; quantity?: number }>;
  }) {
    return this.plantsService.createGardenPlan(body);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get plant species details' })
  async getById(@Param('id') id: string) {
    return this.plantsService.getPlantById(id);
  }
}
