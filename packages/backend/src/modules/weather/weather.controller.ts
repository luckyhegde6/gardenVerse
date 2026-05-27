import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WeatherService } from './weather.service';
import { WeatherQueryDto, IngestWeatherDto } from './dto/weather.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants';

@ApiTags('Weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current weather' })
  async getCurrent(@Query() query: WeatherQueryDto) {
    return this.weatherService.getCurrent(query);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Get weather forecast' })
  async getForecast(@Query('region') region: string) {
    return this.weatherService.getForecast(region);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get weather alerts' })
  async getAlerts(@Query('region') region: string) {
    return this.weatherService.getAlerts(region);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('ingest')
  @ApiOperation({ summary: 'Ingest weather data (admin)' })
  async ingest(@Body() dto: IngestWeatherDto) {
    return this.weatherService.ingest(dto);
  }
}
