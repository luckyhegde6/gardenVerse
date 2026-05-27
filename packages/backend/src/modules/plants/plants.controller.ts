import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlantsService } from './plants.service';

@ApiTags('Plants')
@Controller('plants')
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search plants by name from public datasets + local DB' })
  async searchPlants(@Query('q') query: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.plantsService.searchPlants(query, Number(page), Number(limit));
  }

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

  @Get('plans')
  @ApiOperation({ summary: 'Get public garden plan templates' })
  async getPlans(@Query('season') season?: string, @Query('difficulty') difficulty?: string) {
    return this.plantsService.getGardenPlanTemplates(season, difficulty);
  }

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

  @Get(':id')
  @ApiOperation({ summary: 'Get plant species details' })
  async getById(@Param('id') id: string) {
    return this.plantsService.getPlantById(id);
  }
}
