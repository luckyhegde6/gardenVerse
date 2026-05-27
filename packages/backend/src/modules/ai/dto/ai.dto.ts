import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitScanDto {
  @ApiProperty()
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plantName?: string;
}

export class AiRecommendationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cropId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gardenId?: string;
}
