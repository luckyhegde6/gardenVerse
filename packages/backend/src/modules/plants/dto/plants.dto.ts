import { IsString, IsOptional, IsNumber, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchPlantsDto {
  @ApiProperty()
  @IsString()
  q: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class CreateGardenPlanDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gridWidth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gridHeight?: number;

  @ApiProperty()
  @IsArray()
  plants: Array<{
    speciesId: string;
    plotX: number;
    plotY: number;
    quantity?: number;
  }>;
}
