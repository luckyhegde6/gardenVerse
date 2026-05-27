import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsInt, Min, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@/common/constants';

export class AdminRegisterDto {
  @ApiProperty({ example: 'superadmin@gardenverse.io' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@123456' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'super_admin' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({ example: 'SUPER_ADMIN_REGISTRATION_CODE' })
  @IsString()
  registrationCode: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'superadmin@gardenverse.io' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class AdminUserQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}

export class AdminInviteDto {
  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  maxUses?: number;

  @ApiPropertyOptional({ example: '7d' })
  @IsOptional()
  @IsString()
  expiresIn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}

export class CreateAdminInviteDto {
  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ example: '7d' })
  @IsOptional()
  @IsString()
  expiresIn?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requirePasscode?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passcode?: string;
}

export class TokenTransactionQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export class AppLogQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
