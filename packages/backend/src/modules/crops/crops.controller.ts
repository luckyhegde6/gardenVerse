import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CropsService } from './crops.service';
import { PlantCropDto, BatchPlantCropDto, UpdateCropDto } from './dto/crop.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Crops')
@Controller('crops')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Post()
  @ApiOperation({ summary: 'Plant a crop' })
  async plant(@CurrentUser('id') userId: string, @Body() dto: PlantCropDto) {
    return this.cropsService.plant(userId, dto);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch plant crops' })
  async batchPlant(@CurrentUser('id') userId: string, @Body() dto: BatchPlantCropDto) {
    return this.cropsService.batchPlant(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all crops in my garden' })
  async getAll(@CurrentUser('id') userId: string) {
    return this.cropsService.getByGarden(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get crop by ID' })
  async getById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cropsService.getById(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update crop' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCropDto,
  ) {
    return this.cropsService.update(id, userId, dto);
  }

  @Post(':id/water')
  @ApiOperation({ summary: 'Water a crop' })
  async water(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cropsService.water(id, userId);
  }

  @Post(':id/fertilize')
  @ApiOperation({ summary: 'Fertilize a crop' })
  async fertilize(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cropsService.fertilize(id, userId);
  }

  @Post(':id/harvest')
  @ApiOperation({ summary: 'Harvest a crop' })
  async harvest(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cropsService.harvest(id, userId);
  }

  @Post('bulk/water')
  @ApiOperation({ summary: 'Water all crops' })
  async bulkWater(@CurrentUser('id') userId: string) {
    return this.cropsService.bulkWater(userId);
  }

  @Post('bulk/fertilize')
  @ApiOperation({ summary: 'Fertilize all crops' })
  async bulkFertilize(@CurrentUser('id') userId: string) {
    return this.cropsService.bulkFertilize(userId);
  }
}
