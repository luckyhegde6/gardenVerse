import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { WeatherQueryDto, IngestWeatherDto } from './dto/weather.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly openweatherUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(
    private prisma: PrismaService,
    private http: HttpService,
    private config: ConfigService,
  ) {}

  async getCurrent(query: WeatherQueryDto) {
    const apiKey = this.config.get<string>('WEATHER_API_KEY');

    if (apiKey && (query.lat || query.lng)) {
      try {
        return await this.fetchFromOpenWeather(query);
      } catch (err) {
        this.logger.warn(`OpenWeatherMap fetch failed, trying DB cache: ${err}`);
      }
    }

    const record = await this.prisma.weatherRecord.findFirst({
      where: {
        region: { contains: query.region, mode: 'insensitive' },
        expiresAt: { gt: new Date() },
      },
      orderBy: { recordedAt: 'desc' },
    });

    return record || this.generateSimulatedWeather(query);
  }

  async getForecast(region: string) {
    const apiKey = this.config.get<string>('WEATHER_API_KEY');
    if (apiKey) {
      try {
        const { data } = await firstValueFrom(
          this.http.get(`${this.openweatherUrl}/forecast`, {
            params: { q: region, appid: apiKey, units: 'metric', cnt: 7 },
          }),
        );
        return this.mapForecastResponse(data);
      } catch { this.logger.warn('OpenWeather forecast failed, using simulated'); }
    }

    const record = await this.prisma.weatherRecord.findFirst({
      where: {
        region: { contains: region, mode: 'insensitive' },
        forecast: { not: Prisma.JsonNull },
      },
      orderBy: { recordedAt: 'desc' },
    });
    return record?.forecast || this.generateSimulatedForecast();
  }

  async getAlerts(region: string) {
    const apiKey = this.config.get<string>('WEATHER_API_KEY');
    if (apiKey) {
      try {
        const { data } = await firstValueFrom(
          this.http.get(`${this.openweatherUrl}/weather`, {
            params: { q: region, appid: apiKey, units: 'metric' },
          }),
        );
        return this.checkForAlerts(data);
      } catch { this.logger.warn('OpenWeather alerts check failed'); }
    }

    const record = await this.prisma.weatherRecord.findFirst({
      where: {
        region: { contains: region, mode: 'insensitive' },
        alerts: { not: Prisma.JsonNull },
        expiresAt: { gt: new Date() },
      },
      orderBy: { recordedAt: 'desc' },
    });
    return record?.alerts || [];
  }

  async ingest(dto: IngestWeatherDto) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 3);
    return this.prisma.weatherRecord.create({ data: { ...dto, expiresAt } });
  }

  private async fetchFromOpenWeather(query: WeatherQueryDto) {
    const params: any = { appid: this.config.get('WEATHER_API_KEY'), units: 'metric' };
    if (query.lat && query.lng) {
      params.lat = query.lat;
      params.lon = query.lng;
    } else {
      params.q = query.region;
    }

    const { data } = await firstValueFrom(
      this.http.get(`${this.openweatherUrl}/weather`, { params }),
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 3);

    const record = await this.prisma.weatherRecord.create({
      data: {
        region: data.name || query.region,
        temperature: data.main?.temp ?? 20,
        humidity: data.main?.humidity ?? 50,
        rainfall: data.rain?.['1h'] || data.rain?.['3h'] || 0,
        windSpeed: data.wind?.speed ?? 0,
        sunlightHours: this.estimateSunlight(data),
        condition: this.mapWeatherCondition(data.weather?.[0]?.main),
        forecast: await this.fetchForecastForDb(data.coord?.lat, data.coord?.lon),
        expiresAt,
      },
    });

    return record;
  }

  private async fetchForecastForDb(lat?: number, lon?: number) {
    if (!lat || !lon) return undefined;
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.openweatherUrl}/forecast`, {
          params: { lat, lon, appid: this.config.get('WEATHER_API_KEY'), units: 'metric', cnt: 5 },
        }),
      );
      return this.mapForecastResponse(data);
    } catch {
      return undefined;
    }
  }

  private mapWeatherCondition(owmCondition?: string): string {
    const map: Record<string, string> = {
      'Clear': 'CLEAR', 'Clouds': 'CLOUDY', 'Rain': 'RAIN',
      'Drizzle': 'RAIN', 'Thunderstorm': 'STORM', 'Snow': 'RAIN',
      'Mist': 'CLOUDY', 'Fog': 'CLOUDY', 'Haze': 'CLOUDY',
      'Dust': 'DROUGHT', 'Smoke': 'DROUGHT',
    };
    return map[owmCondition || ''] || 'CLEAR';
  }

  private mapForecastResponse(data: any) {
    if (!data?.list) return [];

    const daily = new Map<string, any>();
    for (const item of data.list) {
      const date = item.dt_txt?.split(' ')[0];
      if (!date || daily.has(date)) continue;
      daily.set(date, {
        date,
        temperature: { min: item.main?.temp_min, max: item.main?.temp_max },
        humidity: item.main?.humidity,
        condition: this.mapWeatherCondition(item.weather?.[0]?.main),
        precipitation: item.pop ? item.pop * 100 : 0,
        windSpeed: item.wind?.speed,
      });
    }

    return Array.from(daily.values()).slice(0, 7);
  }

  private checkForAlerts(data: any): any[] {
    const alerts: any[] = [];
    const temp = data.main?.temp;

    if (temp && temp > 40) {
      alerts.push({
        type: 'HEATWAVE',
        severity: 'HIGH',
        message: `Extreme heat (${temp}°C) — protect plants from sunburn`,
        startTime: new Date().toISOString(),
      });
    }
    if (temp && temp < 0) {
      alerts.push({
        type: 'FREEZE',
        severity: 'HIGH',
        message: `Freezing temperatures (${temp}°C) — bring sensitive plants indoors`,
        startTime: new Date().toISOString(),
      });
    }
    if (data.wind?.speed > 15) {
      alerts.push({
        type: 'WIND',
        severity: 'MEDIUM',
        message: `Strong winds (${data.wind.speed} m/s) — secure tall plants`,
        startTime: new Date().toISOString(),
      });
    }

    return alerts;
  }

  private estimateSunlight(data: any): number {
    const clouds = data.clouds?.all ?? 50;
    return Math.max(1, Math.round((100 - clouds) / 10));
  }

  private generateSimulatedWeather(query: WeatherQueryDto) {
    return {
      region: query.region,
      temperature: 20 + Math.random() * 10,
      humidity: 40 + Math.random() * 30,
      rainfall: Math.random() * 10,
      windSpeed: Math.random() * 20,
      sunlightHours: 6 + Math.random() * 6,
      condition: 'CLEAR',
      forecast: this.generateSimulatedForecast(),
    };
  }

  private generateSimulatedForecast() {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        temperature: { min: 12 + Math.random() * 8, max: 20 + Math.random() * 12 },
        humidity: 40 + Math.random() * 30,
        condition: ['CLEAR', 'CLOUDY', 'RAIN', 'PARTLY_CLOUDY'][Math.floor(Math.random() * 4)],
        precipitation: Math.random() * 40,
      });
    }
    return days;
  }
}
