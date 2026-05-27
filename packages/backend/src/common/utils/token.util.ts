import * as crypto from 'crypto';

export class TokenUtil {
  static generateOtp(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      otp += digits[bytes[i] % 10];
    }
    return otp;
  }

  static generateInviteCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  }

  static generateSessionToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  static generateDeviceId(): string {
    return crypto.randomUUID();
  }

  static generateApiKey(): string {
    const prefix = 'gv_';
    const key = crypto.randomBytes(32).toString('hex');
    return `${prefix}${key}`;
  }

  static generatePasscode(length: number = 6): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  }
}
