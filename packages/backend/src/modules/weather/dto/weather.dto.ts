import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WeatherQueryDto {
  @ApiProperty()
  @IsString()
  region: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lng?: number;
}

export class IngestWeatherDto {
  @ApiProperty()
  @IsString()
  region: string;

  @ApiProperty()
  @IsNumber()
  temperature: number;

  @ApiProperty()
  @IsNumber()
  humidity: number;

  @ApiProperty()
  @IsNumber()
  rainfall: number;

  @ApiProperty()
  @IsNumber()
  windSpeed: number;

  @ApiProperty()
  @IsNumber()
  sunlightHours: number;

  @ApiProperty()
  @IsString()
  condition: string;
}
