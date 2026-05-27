import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/analytics.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/constants';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('track')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track an event' })
  async trackEvent(@CurrentUser('id') userId: string, @Body() dto: TrackEventDto) {
    return this.analyticsService.trackEvent(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('dau-mau')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get DAU/MAU (admin)' })
  async getDauMau() {
    return this.analyticsService.getDauMau();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('engagement')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get engagement metrics (admin)' })
  async getEngagement() {
    return this.analyticsService.getEngagementMetrics();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('regional')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get regional activity (admin)' })
  async getRegionalActivity() {
    return this.analyticsService.getRegionalActivity();
  }
}
