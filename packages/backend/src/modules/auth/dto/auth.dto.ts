import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsPhoneNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class VerifyOtpDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp: string;
}

export class RequestPasswordResetDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}

export class LinkTelegramDto {
  @ApiProperty()
  @IsString()
  telegramId: string;

  @ApiProperty()
  @IsString()
  verificationCode: string;
}

export class DeviceTrustDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceType?: string;
}
