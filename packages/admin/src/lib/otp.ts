import * as crypto from 'crypto'

interface OtpEntry {
  otp: string
  expiresAt: number
}

const otpStore = new Map<string, OtpEntry>()

// Periodically clean up expired entries
let lastCleanup = 0
function cleanup(): void {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  otpStore.forEach((entry, key) => {
    if (now > entry.expiresAt) otpStore.delete(key)
  })
}

/**
 * Generate a cryptographically secure 6-digit OTP.
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

/**
 * Store an OTP with an expiry (default 10 minutes).
 */
export function storeOtp(key: string, otp: string, ttlMs = 10 * 60 * 1000): void {
  cleanup()
  otpStore.set(key, { otp, expiresAt: Date.now() + ttlMs })
}

/**
 * Verify and consume an OTP. Returns true if valid.
 */
export function verifyOtp(key: string, otp: string): boolean {
  cleanup()
  const entry = otpStore.get(key)
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key)
    return false
  }
  if (entry.otp !== otp) return false
  otpStore.delete(key) // one-time use
  return true
}
