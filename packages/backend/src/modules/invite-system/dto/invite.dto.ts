import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInviteDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiresIn?: string;
}

export class RedeemInviteDto {
  @ApiProperty()
  @IsString()
  code: string;
}
