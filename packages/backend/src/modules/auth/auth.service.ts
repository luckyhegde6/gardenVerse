import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { GamificationService } from '@/modules/gamification/gamification.service';
import { TokenUtil } from '@/common/utils/token.util';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  VerifyOtpDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  LinkTelegramDto,
  DeviceTrustDto,
} from './dto/auth.dto';
import { AuthTokens, JwtPayload, DeviceInfo } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpStore = new Map<string, { otp: string; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private gamificationService: GamificationService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string; userId: string }> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException('Email already registered');
      }
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName,
        phone: dto.phone,
        passwordHash,
      },
    });

    // Create garden automatically
    await this.prisma.garden.create({
      data: {
        userId: user.id,
        name: `${dto.username}'s Garden`,
      },
    });

    // Auto-verify if email verification is disabled (no SMTP configured)
    const requireVerification = this.configService.get('REQUIRE_EMAIL_VERIFICATION', 'false') === 'true';

    if (requireVerification) {
      const otp = TokenUtil.generateOtp();
      this.otpStore.set(dto.email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
      this.logger.log(`OTP sent to ${dto.email} (for verification)`);
      return { message: 'Registration successful. Please verify your email with OTP.', userId: user.id };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    await this.gamificationService.initUserGamification(user.id);

    return { message: 'Registration successful.', userId: user.id };
  }

  async login(dto: LoginDto, deviceInfo?: DeviceInfo): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        role: true,
        isVerified: true,
        isBlocked: true,
        blockedReason: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException(
        user.blockedReason
          ? `Account blocked: ${user.blockedReason}. Please contact support for assistance.`
          : 'Account blocked. Please contact support for assistance.'
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: new Date(),
        currentStreak: { increment: 1 },
        ...(deviceInfo?.trustScore !== undefined
          ? { deviceTrustScore: deviceInfo.trustScore }
          : {}),
      },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET is not configured');
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {
    const stored = this.otpStore.get(dto.email);

    if (!stored) {
      throw new BadRequestException('No OTP requested for this email');
    }

    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(dto.email);
      throw new BadRequestException('OTP has expired');
    }

    if (stored.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    this.otpStore.delete(dto.email);

    await this.prisma.user.update({
      where: { email: dto.email },
      data: { isVerified: true },
    });

    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (!user) {
      return { message: 'If the email exists, a reset OTP has been sent.' };
    }

    const otp = TokenUtil.generateOtp();
    this.otpStore.set(`reset:${dto.email}`, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    this.logger.log(`Password reset OTP sent to ${dto.email}`);

    return { message: 'If the email exists, a reset OTP has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const stored = this.otpStore.get(`reset:${dto.email}`);

    if (!stored) {
      throw new BadRequestException('No password reset requested for this email');
    }

    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(`reset:${dto.email}`);
      throw new BadRequestException('OTP has expired');
    }

    if (stored.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    this.otpStore.delete(`reset:${dto.email}`);

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { email: dto.email },
      data: { passwordHash },
    });

    return { message: 'Password reset successfully' };
  }

  async linkTelegram(userId: string, dto: LinkTelegramDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findFirst({
      where: { telegramId: dto.telegramId },
      select: { id: true },
    });

    if (existing && existing.id !== userId) {
      throw new ConflictException('Telegram account already linked to another user');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { telegramId: dto.telegramId },
    });

    return { message: 'Telegram account linked successfully' };
  }

  async updateDeviceTrust(userId: string, dto: DeviceTrustDto): Promise<{ trustScore: number }> {
    const baseScore = 50;
    const deviceBonus = dto.deviceType ? 20 : 0;
    const trustScore = Math.min(100, baseScore + deviceBonus);

    await this.prisma.user.update({
      where: { id: userId },
      data: { deviceTrustScore: trustScore },
    });

    return { trustScore };
  }

  private async generateTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, role };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!jwtSecret) throw new Error('JWT_SECRET is not configured');
    if (!jwtRefreshSecret) throw new Error('JWT_REFRESH_SECRET is not configured');

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtRefreshSecret,
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
    });

    // Store session
    await this.prisma.session.create({
      data: {
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }
}
