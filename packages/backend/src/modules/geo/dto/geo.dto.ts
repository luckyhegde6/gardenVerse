import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;
}

export class NearbyQueryDto {
  @ApiProperty()
  @IsString()
  geohash: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  radius?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
