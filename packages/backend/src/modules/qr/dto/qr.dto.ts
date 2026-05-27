import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateQrDto {
  @ApiProperty({ enum: ['INVITE', 'MARKETPLACE', 'DEVICE_PAIRING', 'GARDEN_SHARE', 'EVENT'] })
  @IsString()
  type: string;

  @ApiProperty()
  payload: any;

  @ApiPropertyOptional({ default: 300 })
  @IsOptional()
  expiresInSeconds?: number;
}

export class UseQrDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty()
  @IsString()
  signature: string;
}
