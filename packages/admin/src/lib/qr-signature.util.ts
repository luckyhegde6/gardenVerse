import * as crypto from 'crypto';
import { CryptoUtil } from './crypto.util';

export interface QrPayload {
  type: string;
  data: unknown;
  nonce: string;
  createdAt: string;
}

export class QrSignatureUtil {
  private static getSigningKey(secretKey?: string): string {
    const key = secretKey || process.env.ENCRYPTION_KEY
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required')
    }
    return key
  }

  static sign(payload: QrPayload, secretKey?: string): string {
    const payloadStr = JSON.stringify(payload);
    const hash = crypto.createHmac('sha256', this.getSigningKey(secretKey))
      .update(payloadStr)
      .digest('hex');

    const encrypted = CryptoUtil.encrypt(payloadStr, secretKey);
    return JSON.stringify({
      payload: encrypted,
      signature: hash,
    });
  }

  static verify(signedData: string, secretKey?: string): QrPayload | null {
    try {
      const parsed = JSON.parse(signedData);
      const { payload, signature } = parsed;

      const decryptedStr = CryptoUtil.decrypt(
        payload.encrypted,
        payload.iv,
        payload.tag,
        secretKey,
      );

      const expectedSig = crypto
        .createHmac('sha256', this.getSigningKey(secretKey))
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

  static isExpired(payload: QrPayload, maxAgeMs: number = 5 * 60 * 1000): boolean {
    const createdAt = new Date(payload.createdAt).getTime();
    return Date.now() - createdAt > maxAgeMs;
  }
}
