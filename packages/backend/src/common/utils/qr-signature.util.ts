import * as crypto from 'crypto';
import { EncryptionUtil } from './encryption.util';

export interface QrPayload {
  type: string;
  data: any;
  nonce: string;
  createdAt: string;
}

export class QrSignatureUtil {
  static sign(payload: QrPayload, secretKey?: string): string {
    const payloadStr = JSON.stringify(payload);
    const hash = crypto.createHmac('sha256', secretKey || process.env.ENCRYPTION_KEY || 'qr-signing-key')
      .update(payloadStr)
      .digest('hex');

    const encrypted = EncryptionUtil.encrypt(payloadStr, secretKey);
    return JSON.stringify({
      payload: encrypted,
      signature: hash,
    });
  }

  static verify(signedData: string, secretKey?: string): QrPayload | null {
    try {
      const parsed = JSON.parse(signedData);
      const { payload, signature } = parsed;

      const decryptedStr = EncryptionUtil.decrypt(
        payload.encrypted,
        payload.iv,
        payload.tag,
        secretKey,
      );

      const expectedSig = crypto
        .createHmac('sha256', secretKey || process.env.ENCRYPTION_KEY || 'qr-signing-key')
        .update(decryptedStr)
        .digest('hex');

      if (expectedSig !== signature) {
        return null;
      }

      return JSON.parse(decryptedStr) as QrPayload;
    } catch {
      return null;
    }
  }

  static generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  static isExpired(payload: QrPayload, maxAgeMs: number = 5 * 60 * 1000): boolean {
    const createdAt = new Date(payload.createdAt).getTime();
    return Date.now() - createdAt > maxAgeMs;
  }
}
