import { NextRequest } from 'next/server'
import { success, badRequest, serverError } from '@/lib/middleware/auth'
import { strictRateLimit } from '@/lib/middleware/rate-limit'
import { verifyOtp } from '@/lib/otp'

export async function POST(request: NextRequest) {
  const rateLimitResult = strictRateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const body = await request.json()
    const { email, otp } = body as { email?: string; otp?: string }

    if (!email || !otp) {
      return badRequest('Email and OTP are required')
    }

    const valid = verifyOtp(`otp:${email}`, otp)

    if (!valid) {
      return badRequest('Invalid or expired OTP')
    }

    return success({ message: 'OTP verified successfully' })
  } catch (error) {
    return serverError(error)
  }
}
