import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, badRequest, serverError } from '@/lib/middleware/auth'

const otpStore = new Map<string, { otp: string; expiresAt: number }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body as { email?: string; otp?: string }

    if (!email || !otp) {
      return badRequest('Email and OTP are required')
    }

    if (otp.length !== 6) {
      return badRequest('OTP must be 6 characters')
    }

    const stored = otpStore.get(email)

    if (!stored) {
      return badRequest('No OTP requested for this email')
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email)
      return badRequest('OTP has expired')
    }

    if (stored.otp !== otp) {
      return badRequest('Invalid OTP')
    }

    otpStore.delete(email)

    await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    })

    return success({ message: 'Email verified successfully' })
  } catch (error) {
    return serverError(error)
  }
}
