import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ enum: ['ABUSE', 'SPAM', 'HARASSMENT', 'SCAM', 'FRAUD', 'INAPPROPRIATE'] })
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  evidence?: any;
}

export class ActionReportDto {
  @ApiProperty({ enum: ['INVESTIGATING', 'RESOLVED', 'DISMISSED'] })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actionTaken?: string;
}
