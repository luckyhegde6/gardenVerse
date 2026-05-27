import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterDeviceDto, IngestSensorDto } from './dto/iot.dto';
import { IotAgent } from '@/agents/iot/iot-agent.service';

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);

  constructor(
    private prisma: PrismaService,
    private iotAgent: IotAgent,
  ) {}

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    const device = await this.prisma.iotDevice.create({
      data: {
        name: dto.name,
        deviceType: dto.deviceType,
        publicKey: dto.publicKey,
        userId,
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });

    return device;
  }

  async getDevices(userId: string) {
    return this.prisma.iotDevice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDeviceById(id: string, userId: string) {
    const device = await this.prisma.iotDevice.findFirst({
      where: { id, userId },
    });

    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async getSensorReadings(deviceId: string, userId: string) {
    const device = await this.getDeviceById(deviceId, userId);

    return this.prisma.sensorReading.findMany({
      where: { deviceId: device.id },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  async ingestSensorData(deviceId: string, dto: IngestSensorDto) {
    const device = await this.prisma.iotDevice.findUnique({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('Device not found');

    await this.iotAgent.ingestSensorData(
      deviceId,
      device.userId,
      dto.sensorType,
      dto.value,
      dto.unit,
      dto.signature,
    );

    return { message: 'Reading ingested and processed' };
  }

  async validateDeviceTrust(deviceId: string): Promise<number> {
    const device = await this.prisma.iotDevice.findUnique({
      where: { id: deviceId },
      include: { user: true },
    });

    if (!device) return 0;

    let trustScore = 50;

    if (device.isOnline) trustScore += 20;
    if (device.publicKey) trustScore += 15;
    if (device.lastSeenAt) {
      const hoursSinceLastSeen = (Date.now() - device.lastSeenAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastSeen < 1) trustScore += 15;
      else if (hoursSinceLastSeen < 24) trustScore += 5;
    }

    const recentNormal = await this.prisma.sensorReading.count({
      where: { deviceId, isVerified: true, timestamp: { gte: new Date(Date.now() - 86400000) } },
    });
    const recentTotal = await this.prisma.sensorReading.count({
      where: { deviceId, timestamp: { gte: new Date(Date.now() - 86400000) } },
    });

    if (recentTotal > 0) {
      const normalRatio = recentNormal / recentTotal;
      trustScore += Math.round(normalRatio * 10);
    }

    return Math.min(100, trustScore);
  }
}
