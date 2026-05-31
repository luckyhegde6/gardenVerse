import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHybridDto {
  @ApiProperty()
  @IsString()
  parent1Id: string;

  @ApiProperty()
  @IsString()
  parent2Id: string;
}

export class AwardXPDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  amount: number;
}
