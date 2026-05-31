import { IsString, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CropStatus } from '@prisma/client';

export class PlantCropDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  species?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variety?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  plotX?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  plotY?: number;
}

export class BatchPlantCropDto {
  @ApiProperty({ type: [PlantCropDto] })
  @IsArray()
  crops: PlantCropDto[];
}

export class UpdateCropDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  species?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variety?: string;
}

export class CropStatusDto {
  @ApiProperty({ enum: CropStatus })
  @IsEnum(CropStatus)
  status: CropStatus;
}
