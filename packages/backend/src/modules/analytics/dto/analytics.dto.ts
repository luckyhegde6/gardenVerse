import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackEventDto {
  @ApiProperty()
  @IsString()
  event: string;

  @ApiPropertyOptional()
  @IsOptional()
  properties?: any;
}
