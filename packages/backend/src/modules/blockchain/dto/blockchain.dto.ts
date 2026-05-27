import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordTransactionDto {
  @ApiProperty()
  @IsString()
  contractType: string;

  @ApiProperty()
  @IsString()
  action: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tokenId?: string;
}
