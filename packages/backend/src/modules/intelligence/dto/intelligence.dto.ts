import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdvisoryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class IngestAdvisoryDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  region: string;

  @ApiProperty()
  @IsString()
  source: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;
}
