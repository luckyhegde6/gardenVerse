import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';
import { CreateFeatureFlagDto, UpdateFeatureFlagDto, UserOverrideDto } from './dto/feature-flag.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/constants';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Feature Flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all feature flags' })
  async getAllFlags() {
    return this.featureFlagsService.getAllFlags();
  }

  @Public()
  @Get('check/:name')
  @ApiOperation({ summary: 'Check a feature flag' })
  async checkFlag(@Param('name') name: string, @Query('userId') userId?: string) {
    return this.featureFlagsService.checkFlag(name, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a feature flag (admin)' })
  async createFlag(@Body() dto: CreateFeatureFlagDto) {
    return this.featureFlagsService.createFlag(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Put(':name')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a feature flag (admin)' })
  async updateFlag(@Param('name') name: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.featureFlagsService.updateFlag(name, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':name')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a feature flag (admin)' })
  async deleteFlag(@Param('name') name: string) {
    return this.featureFlagsService.deleteFlag(name);
  }

  @UseGuards(JwtAuthGuard)
  @Post('override')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set user feature override' })
  async setOverride(@CurrentUser('id') userId: string, @Body() dto: UserOverrideDto) {
    return this.featureFlagsService.setUserOverride(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('override/:featureName')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove user feature override' })
  async removeOverride(@CurrentUser('id') userId: string, @Param('featureName') featureName: string) {
    return this.featureFlagsService.removeUserOverride(userId, featureName);
  }
}
