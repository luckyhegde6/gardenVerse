import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface RateEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateEntry>()

// Clean up expired entries periodically to prevent memory leaks
let lastCleanup = 0
function cleanup(): void {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return // cleanup at most once per minute
  lastCleanup = now
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key)
  })
}

export interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
}

export function rateLimit(request: NextRequest, options: RateLimitOptions): NextResponse | null {
  const { windowMs, maxRequests, keyPrefix = 'rl' } = options

  // Identify client by IP (or fallback to a default)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  const key = `${keyPrefix}:${ip}`
  const now = Date.now()

  cleanup()

  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  entry.count++
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests', retryAfter }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    )
  }

  return null
}

// Pre-configured rate limiters for different endpoint categories
export const authRateLimit = (request: NextRequest) =>
  rateLimit(request, { windowMs: 15 * 60 * 1000, maxRequests: 10, keyPrefix: 'auth' })

export const apiRateLimit = (request: NextRequest) =>
  rateLimit(request, { windowMs: 60 * 1000, maxRequests: 60, keyPrefix: 'api' })

export const strictRateLimit = (request: NextRequest) =>
  rateLimit(request, { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'strict' })
