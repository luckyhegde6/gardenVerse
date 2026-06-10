import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, badRequest, serverError } from '@/lib/middleware/auth'
import { strictRateLimit } from '@/lib/middleware/rate-limit'
import { generateOtp, storeOtp } from '@/lib/otp'

export async function POST(request: NextRequest) {
  const rateLimitResult = strictRateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const body = await request.json()
    const { email } = body as { email?: string }

    if (!email) {
      return badRequest('Email is required')
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return success({ message: 'If the email exists, a reset OTP has been sent.' })
    }

    const otp = generateOtp()
    storeOtp(`reset:${email}`, otp)

    // TODO: Send OTP via email service

    return success({ message: 'If the email exists, a reset OTP has been sent.' })
  } catch (error) {
    return serverError(error)
  }
}
