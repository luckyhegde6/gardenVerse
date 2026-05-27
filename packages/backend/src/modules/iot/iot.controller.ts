import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IotService } from './iot.service';
import { RegisterDeviceDto, IngestSensorDto } from './dto/iot.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '@/common/guards/optional-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('IoT')
@Controller('iot')
export class IotController {
  constructor(private readonly iotService: IotService) {}

  @UseGuards(JwtAuthGuard)
  @Post('devices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a device' })
  async registerDevice(@CurrentUser('id') userId: string, @Body() dto: RegisterDeviceDto) {
    return this.iotService.registerDevice(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('devices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my devices' })
  async getDevices(@CurrentUser('id') userId: string) {
    return this.iotService.getDevices(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('devices/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get device by ID' })
  async getDevice(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.iotService.getDeviceById(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('devices/:id/readings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sensor readings' })
  async getReadings(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.iotService.getSensorReadings(id, userId);
  }

  @Post('devices/:id/sensor')
  @ApiOperation({ summary: 'Ingest sensor data' })
  async ingestSensor(@Param('id') id: string, @Body() dto: IngestSensorDto) {
    return this.iotService.ingestSensorData(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('devices/:id/trust')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate device trust' })
  async validateTrust(@Param('id') id: string) {
    const score = await this.iotService.validateDeviceTrust(id);
    return { deviceId: id, trustScore: score };
  }
}
