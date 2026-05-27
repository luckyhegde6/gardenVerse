import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SensorType } from '@prisma/client';

export class RegisterDeviceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['ESP32', 'RASPBERRY_PI', 'CUSTOM'] })
  @IsString()
  deviceType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicKey?: string;
}

export class IngestSensorDto {
  @ApiProperty({ enum: SensorType })
  @IsEnum(SensorType)
  sensorType: SensorType;

  @ApiProperty()
  @IsNumber()
  value: number;

  @ApiProperty()
  @IsString()
  unit: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signature?: string;
}
