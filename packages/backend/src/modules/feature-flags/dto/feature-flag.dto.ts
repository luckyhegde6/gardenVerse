import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeatureFlagDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  rules?: any;
}

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  rules?: any;
}

export class UserOverrideDto {
  @ApiProperty()
  @IsString()
  featureName: string;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}
