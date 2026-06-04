import { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma/client'
import { success, badRequest, serverError } from '@/lib/middleware/auth'

const otpStore = new Map<string, { otp: string; expiresAt: number }>()

export async function POST(request: NextRequest) {
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

    if (otp.length !== 6) {
      return badRequest('OTP must be 6 characters')
    }

    const stored = otpStore.get(`reset:${email}`)

    if (!stored) {
      return badRequest('No password reset requested for this email')
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(`reset:${email}`)
      return badRequest('OTP has expired')
    }

    if (stored.otp !== otp) {
      return badRequest('Invalid OTP')
    }

    otpStore.delete(`reset:${email}`)

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    })

    return success({ message: 'Password reset successfully' })
  } catch (error) {
    return serverError(error)
  }
}
