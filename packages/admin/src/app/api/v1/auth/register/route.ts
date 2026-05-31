import { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma/client'
import { success, badRequest, serverError } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, username, displayName, phone } = body as {
      email?: string
      password?: string
      username?: string
      displayName?: string
      phone?: string
    }

    if (!email || !password || !username) {
      return badRequest('Email, password, and username are required')
    }

    if (password.length < 8) {
      return badRequest('Password must be at least 8 characters')
    }

    if (username.length < 3) {
      return badRequest('Username must be at least 3 characters')
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return badRequest('Email already registered')
      }
      return badRequest('Username already taken')
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: displayName || username,
        phone,
        passwordHash,
      },
    })

    await prisma.garden.create({
      data: {
        userId: user.id,
        name: `${username}'s Garden`,
      },
    })

    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'

    if (!requireVerification) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      })
    }

    return success({
      message: requireVerification
        ? 'Registration successful. Please verify your email with OTP.'
        : 'Registration successful.',
      userId: user.id,
    }, 201)
  } catch (error) {
    return serverError(error)
  }
}
