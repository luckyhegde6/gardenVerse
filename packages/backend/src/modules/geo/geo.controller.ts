import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GeoService } from './geo.service';
import { UpdateLocationDto, NearbyQueryDto } from './dto/geo.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @UseGuards(JwtAuthGuard)
  @Post('location')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update location (with Google Maps reverse geocoding)' })
  async updateLocation(@CurrentUser('id') userId: string, @Body() dto: UpdateLocationDto) {
    return this.geoService.updateLocation(userId, dto);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby gardeners' })
  async getNearby(@Query() query: NearbyQueryDto) {
    return this.geoService.getNearbyGardeners(query);
  }

  @Public()
  @Get('regional-stats')
  @ApiOperation({ summary: 'Get regional statistics' })
  async getRegionalStats(@Query('region') region: string) {
    return this.geoService.getRegionalStats(region);
  }

  @Public()
  @Get('regional-leaderboard')
  @ApiOperation({ summary: 'Get regional leaderboard' })
  async getRegionalLeaderboard(@Query('region') region: string) {
    return this.geoService.getRegionalLeaderboard(region);
  }

  @Public()
  @Get('places/search')
  @ApiOperation({ summary: 'Search places via Google Maps API' })
  async searchPlaces(@Query('q') query: string) {
    return this.geoService.searchPlace(query);
  }

  @Public()
  @Get('geocode/reverse')
  @ApiOperation({ summary: 'Reverse geocode coordinates via Google Maps' })
  async reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.geoService.reverseGeocode(Number(lat), Number(lng));
  }
}
