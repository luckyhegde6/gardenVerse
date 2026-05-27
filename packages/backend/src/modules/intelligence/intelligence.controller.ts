import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IntelligenceService } from './intelligence.service';
import { AdvisoryQueryDto, IngestAdvisoryDto } from './dto/intelligence.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Intelligence')
@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Public()
  @Get('advisories')
  @ApiOperation({ summary: 'Get government advisories' })
  async getAdvisories(@Query() query: AdvisoryQueryDto) {
    return this.intelligenceService.getAdvisories(query);
  }

  @Public()
  @Get('schemes')
  @ApiOperation({ summary: 'Get government schemes' })
  async getSchemes(@Query() query: AdvisoryQueryDto) {
    return this.intelligenceService.getGovernmentSchemes(query);
  }

  @Public()
  @Get('news')
  @ApiOperation({ summary: 'Get regional agriculture news' })
  async getNews(@Query('region') region: string) {
    return this.intelligenceService.getRegionalAgricultureNews(region);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search advisories' })
  async search(@Query('q') query: string) {
    return this.intelligenceService.searchAdvisories(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('ingest')
  @ApiOperation({ summary: 'Ingest advisory (admin)' })
  async ingest(@Body() dto: IngestAdvisoryDto) {
    return this.intelligenceService.ingestAdvisory(dto);
  }
}
