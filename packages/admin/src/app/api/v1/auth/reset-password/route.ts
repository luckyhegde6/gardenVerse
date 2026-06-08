import { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma/client'
import { success, badRequest, serverError } from '@/lib/middleware/auth'
import { strictRateLimit } from '@/lib/middleware/rate-limit'
import { verifyOtp } from '@/lib/otp'

export async function POST(request: NextRequest) {
  const rateLimitResult = strictRateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const body = await request.json()
    const { email, otp, newPassword } = body as {
      email?: string
      otp?: string
      newPassword?: string
    }

    if (!email || !otp || !newPassword) {
      return badRequest('Email, OTP, and new password are required')
    }

    if (newPassword.length < 8) {
      return badRequest('Password must be at least 8 characters')
    }

    const valid = verifyOtp(`reset:${email}`, otp)

    if (!valid) {
      return badRequest('Invalid or expired OTP')
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    })

    // Revoke all existing sessions for this user
    await prisma.session.updateMany({
      where: { userId: (await prisma.user.findUnique({ where: { email }, select: { id: true } }))?.id, isRevoked: false },
      data: { isRevoked: true },
    })

    return success({ message: 'Password reset successfully' })
  } catch (error) {
    return serverError(error)
  }
}
