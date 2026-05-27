import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { BaseAgent } from '../base-agent.service';
import { AgentOrchestrator } from '../agent-orchestrator.service';
import { AgentName, AgentEvent, EVENT_TYPES, AGENT_CONFIGS } from '../types/agent.types';

@Injectable()
export class IotAgent extends BaseAgent {
  protected readonly agentName = AgentName.IOT;
  protected readonly agentVersion = '1.0.0';
  protected readonly eventSubscriptions: string[] = [];
  protected readonly eventEmissions = [
    EVENT_TYPES.SENSOR_DATA,
    EVENT_TYPES.DEVICE_ONLINE,
    EVENT_TYPES.DEVICE_OFFLINE,
    EVENT_TYPES.DEVICE_TRUST_UPDATED,
  ];

  private readonly ANOMALY_THRESHOLDS: Record<string, { min: number; max: number }> = {
    SOIL_MOISTURE: { min: 10, max: 90 },
    TEMPERATURE: { min: 0, max: 50 },
    HUMIDITY: { min: 10, max: 100 },
    PH: { min: 4.0, max: 9.0 },
    LIGHT: { min: 0, max: 150000 },
  };

  constructor(
    orchestrator: AgentOrchestrator,
    private prisma: PrismaService,
  ) {
    super(orchestrator);
    this.logger = new Logger(IotAgent.name);
    this.config = AGENT_CONFIGS[AgentName.IOT];
  }

  async onEvent(_event: AgentEvent): Promise<void> {
    // IoT agent is primarily MQTT-driven; events come via HTTP ingestion
  }

  async ingestSensorData(
    deviceId: string,
    userId: string,
    sensorType: string,
    value: number,
    unit: string,
    signature?: string,
  ): Promise<void> {
    const trustScore = await this.validateReading(deviceId, sensorType, value, signature);
    const isAnomalous = trustScore < 30;

    await this.prisma.sensorReading.create({
      data: {
        sensorType: sensorType as any,
        value,
        unit,
        deviceId,
        userId,
        isVerified: trustScore > 50,
      },
    });

    if (!isAnomalous) {
      await this.emit(EVENT_TYPES.SENSOR_DATA, {
        deviceId,
        userId,
        sensorType,
        value,
        unit,
        timestamp: new Date().toISOString(),
        trustScore,
      });

      await this.prisma.iotDevice.update({
        where: { id: deviceId },
        data: { lastSeenAt: new Date(), isOnline: true },
      });
    } else {
      this.logger.warn(`Anomalous reading from device ${deviceId}: ${sensorType}=${value}`);
      await this.prisma.iotDevice.update({
        where: { id: deviceId },
        data: { isOnline: false },
      });
      await this.emit(EVENT_TYPES.DEVICE_OFFLINE, {
        deviceId,
        userId,
        isOnline: false,
        lastSeen: new Date().toISOString(),
      });
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkDeviceHealth() {
    this.logger.log('IoT Agent: checking device health...');
    const staleThreshold = new Date(Date.now() - 3600000);
    const staleDevices = await this.prisma.iotDevice.findMany({
      where: {
        isOnline: true,
        lastSeenAt: { lt: staleThreshold },
      },
    });

    for (const device of staleDevices) {
      await this.prisma.iotDevice.update({
        where: { id: device.id },
        data: { isOnline: false },
      });

      await this.emit(EVENT_TYPES.DEVICE_OFFLINE, {
        deviceId: device.id,
        userId: device.userId,
        isOnline: false,
        lastSeen: device.lastSeenAt?.toISOString() || new Date().toISOString(),
      });

      this.logger.warn(`Device ${device.id} marked offline (stale since ${device.lastSeenAt})`);
    }
  }

  private async validateReading(
    deviceId: string,
    sensorType: string,
    value: number,
    signature?: string,
  ): Promise<number> {
    let trustScore = 50;

    const device = await this.prisma.iotDevice.findUnique({
      where: { id: deviceId },
      include: { user: true },
    });

    if (!device) return 0;
    if (!device.isOnline) trustScore -= 10;
    if (device.publicKey && signature) trustScore += 15;

    const threshold = this.ANOMALY_THRESHOLDS[sensorType];
    if (threshold) {
      if (value < threshold.min || value > threshold.max) {
        trustScore -= 30;
      } else {
        const midPoint = (threshold.max + threshold.min) / 2;
        const range = threshold.max - threshold.min;
        const deviation = Math.abs(value - midPoint) / (range / 2);
        if (deviation < 0.3) trustScore += 10;
        else if (deviation > 0.8) trustScore -= 10;
      }
    }

    const recentReadings = await this.prisma.sensorReading.findMany({
      where: { deviceId, sensorType: sensorType as any },
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    if (recentReadings.length >= 3) {
      const avg = recentReadings.reduce((s: number, r: { value: number }) => s + r.value, 0) / recentReadings.length;
      const suddenChange = Math.abs(value - avg) / (avg || 1);
      if (suddenChange > 0.5) trustScore -= 20;
    }

    return Math.max(0, Math.min(100, trustScore));
  }
}
