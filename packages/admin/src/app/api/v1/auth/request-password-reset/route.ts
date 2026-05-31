import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, badRequest, serverError } from '@/lib/middleware/auth'

const otpStore = new Map<string, { otp: string; expiresAt: number }>()

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
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

    if (!user) {
      return success({ message: 'If the email exists, a reset OTP has been sent.' })
    }

    const otp = generateOtp()
    otpStore.set(`reset:${email}`, { otp, expiresAt: Date.now() + 10 * 60 * 1000 })

    return success({ message: 'If the email exists, a reset OTP has been sent.' })
  } catch (error) {
    return serverError(error)
  }
}
