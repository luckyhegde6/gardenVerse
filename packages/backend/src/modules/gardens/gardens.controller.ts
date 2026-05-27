import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GardensService } from './gardens.service';
import { CreateGardenDto, UpdateGardenDto } from './dto/garden.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Gardens')
@Controller('gardens')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GardensController {
  constructor(private readonly gardensService: GardensService) {}

  @Post()
  @ApiOperation({ summary: 'Create a garden' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateGardenDto) {
    return this.gardensService.create(userId, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get my garden' })
  async getMine(@CurrentUser('id') userId: string) {
    return this.gardensService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get garden by ID' })
  async getById(@Param('id') id: string) {
    return this.gardensService.findById(id);
  }

  @Put('mine')
  @ApiOperation({ summary: 'Update my garden' })
  async update(@CurrentUser('id') userId: string, @Body() dto: UpdateGardenDto) {
    return this.gardensService.update(userId, dto);
  }

  @Delete('mine')
  @ApiOperation({ summary: 'Delete my garden' })
  async delete(@CurrentUser('id') userId: string) {
    return this.gardensService.delete(userId);
  }

  @Get('mine/analytics')
  @ApiOperation({ summary: 'Get garden analytics' })
  async getAnalytics(@CurrentUser('id') userId: string) {
    return this.gardensService.getAnalytics(userId);
  }
}
