import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  data?: any;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPush?: boolean;
}
