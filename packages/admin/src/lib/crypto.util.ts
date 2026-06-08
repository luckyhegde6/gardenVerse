import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

export class CryptoUtil {
  private static getKey(secretKey?: string): Buffer {
    const key = secretKey || process.env.ENCRYPTION_KEY
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required')
    }
    return crypto.scryptSync(key, 'gardenverse-salt', 32);
  }

  static encrypt(text: string, secretKey?: string): { encrypted: string; iv: string; tag: string } {
    const key = this.getKey(secretKey);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return { encrypted, iv: iv.toString('hex'), tag };
  }

  static decrypt(encrypted: string, iv: string, tag: string, secretKey?: string): string {
    const key = this.getKey(secretKey);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
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

  static generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
