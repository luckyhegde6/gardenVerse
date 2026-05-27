import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { CreateReportDto, ActionReportDto } from './dto/moderation.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/constants';

@ApiTags('Moderation')
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('reports')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a report' })
  async createReport(@CurrentUser('id') userId: string, @Body() dto: CreateReportDto) {
    return this.moderationService.createReport(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-reports')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my reports' })
  async getMyReports(@CurrentUser('id') userId: string) {
    return this.moderationService.getUserReports(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('reports')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reports (moderator)' })
  async getReports(
    @Query('status') status?: string,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ) {
    return this.moderationService.getReports(status, limit, offset);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('reports/:id/action')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Action a report (moderator)' })
  async actionReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ActionReportDto,
  ) {
    return this.moderationService.actionReport(id, userId, dto);
  }
}
