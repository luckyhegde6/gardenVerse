import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { BaseAgent } from '../base-agent.service';
import { AgentOrchestrator } from '../agent-orchestrator.service';
import { AgentName, AgentEvent, EVENT_TYPES, AGENT_CONFIGS } from '../types/agent.types';

@Injectable()
export class WeatherAgent extends BaseAgent {
  protected readonly agentName = AgentName.WEATHER;
  protected readonly agentVersion = '1.0.0';
  protected readonly eventSubscriptions: string[] = [];
  protected readonly eventEmissions = [
    EVENT_TYPES.WEATHER_UPDATED,
    EVENT_TYPES.WEATHER_ALERT,
    EVENT_TYPES.WEATHER_IMPACT_CALCULATED,
  ];

  private readonly REGIONS = [
    'IN-MH', 'IN-DL', 'IN-KA', 'IN-TN', 'IN-UP', 'IN-GJ', 'IN-WB',
    'US-CA', 'US-NY', 'US-TX', 'US-FL',
    'EU-UK', 'EU-DE', 'EU-FR', 'EU-IT',
    'AS-JP', 'AS-CN', 'AS-SG', 'AS-AU',
  ];
  private readonly CONDITIONS = ['CLEAR', 'CLOUDY', 'RAIN', 'STORM', 'DROUGHT', 'HEATWAVE'];

  constructor(
    orchestrator: AgentOrchestrator,
    private prisma: PrismaService,
  ) {
    super(orchestrator);
    this.logger = new Logger(WeatherAgent.name);
    this.config = AGENT_CONFIGS[AgentName.WEATHER];
  }

  async onEvent(_event: AgentEvent): Promise<void> {
    // Weather agent is primarily cron-driven, not event-driven
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async fetchAndPublishWeather() {
    this.logger.log('Weather Intelligence Agent: fetching weather data...');

    for (const region of this.REGIONS) {
      try {
        const weatherData = await this.fetchWeatherForRegion(region);
        await this.prisma.weatherRecord.create({ data: weatherData });
        await this.emit(EVENT_TYPES.WEATHER_UPDATED, weatherData);
        this.logger.debug(`Weather updated for ${region}: ${weatherData.condition}`);
      } catch (err) {
        this.errorsLastHour++;
        this.logger.error(`Failed to fetch weather for ${region}: ${(err as Error).message}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkWeatherAlerts() {
    this.logger.log('Weather Intelligence Agent: checking for alerts...');
    const recentRecords = await this.prisma.weatherRecord.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { recordedAt: 'desc' },
      distinct: ['region'],
    });

    for (const record of recentRecords) {
      const alert = this.generateAlertIfNeeded(record);
      if (alert) {
        await this.emit(EVENT_TYPES.WEATHER_ALERT, alert);
        this.logger.warn(`Weather alert for ${record.region}: ${alert.alertType} (${alert.severity})`);
      }
    }
  }

  private async fetchWeatherForRegion(region: string) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6);

    const condition = this.CONDITIONS[Math.floor(Math.random() * this.CONDITIONS.length)];
    const temperature = this.getRegionalBaseTemp(region) + (Math.random() - 0.5) * 10;
    const humidity = 30 + Math.random() * 50;
    const rainfall = condition === 'RAIN' || condition === 'STORM' ? 5 + Math.random() * 30 : Math.random() * 5;
    const windSpeed = condition === 'STORM' ? 40 + Math.random() * 40 : Math.random() * 30;
    const sunlightHours = condition === 'CLEAR' ? 8 + Math.random() * 4 :
                          condition === 'CLOUDY' ? 3 + Math.random() * 3 : Math.random() * 4;

    return {
      region,
      temperature: parseFloat(temperature.toFixed(1)),
      humidity: parseFloat(humidity.toFixed(1)),
      rainfall: parseFloat(rainfall.toFixed(1)),
      windSpeed: parseFloat(windSpeed.toFixed(1)),
      sunlightHours: parseFloat(sunlightHours.toFixed(1)),
      condition,
      forecast: this.generateForecast(region),
      alerts: [],
      expiresAt,
      recordedAt: new Date(),
    };
  }

  private getRegionalBaseTemp(region: string): number {
    const tempMap: Record<string, number> = {
      'IN-MH': 28, 'IN-DL': 25, 'IN-KA': 27, 'IN-TN': 30, 'IN-UP': 24,
      'IN-GJ': 29, 'IN-WB': 27, 'US-CA': 20, 'US-NY': 12, 'US-TX': 22,
      'US-FL': 25, 'EU-UK': 10, 'EU-DE': 10, 'EU-FR': 13, 'EU-IT': 16,
      'AS-JP': 15, 'AS-CN': 14, 'AS-SG': 28, 'AS-AU': 22,
    };
    return tempMap[region] || 20;
  }

  private generateForecast(region: string) {
    const baseTemp = this.getRegionalBaseTemp(region);
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString(),
        temperature: parseFloat((baseTemp + (Math.random() - 0.5) * 8).toFixed(1)),
        humidity: parseFloat((40 + Math.random() * 40).toFixed(1)),
        condition: this.CONDITIONS[Math.floor(Math.random() * 4)],
      });
    }
    return forecast;
  }

  private generateAlertIfNeeded(record: any): any {
    if (record.condition === 'HEATWAVE' && record.temperature > 40) {
      return {
        region: record.region,
        alertType: 'HEATWAVE',
        severity: record.temperature > 45 ? 'CRITICAL' : 'HIGH',
        message: `Extreme heatwave detected in ${record.region}. Temperature: ${record.temperature}°C`,
        affectedCrops: ['tomato', 'lettuce', 'spinach', 'basil'],
        recommendedAction: 'Increase watering frequency, provide shade, harvest heat-sensitive crops early',
        issuedAt: new Date().toISOString(),
      };
    }
    if (record.condition === 'DROUGHT' && record.rainfall < 1) {
      return {
        region: record.region,
        alertType: 'DROUGHT',
        severity: 'HIGH',
        message: `Drought conditions in ${record.region}. No rainfall detected.`,
        affectedCrops: ['rice', 'wheat', 'corn', 'all'],
        recommendedAction: 'Implement drip irrigation, mulch soil, reduce water-intensive crops',
        issuedAt: new Date().toISOString(),
      };
    }
    if (record.condition === 'STORM' && record.windSpeed > 60) {
      return {
        region: record.region,
        alertType: 'STORM',
        severity: 'HIGH',
        message: `Severe storm warning for ${record.region}. Wind speeds: ${record.windSpeed} km/h`,
        affectedCrops: ['corn', 'sunflower', 'tomato', 'all_tall_crops'],
        recommendedAction: 'Secure plant supports, move potted plants indoors, delay planting',
        issuedAt: new Date().toISOString(),
      };
    }
    return null;
  }
}
