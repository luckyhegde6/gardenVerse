import { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma/client'
import { signToken, success, badRequest, unauthorized, serverError } from '@/lib/middleware/auth'
import { authRateLimit } from '@/lib/middleware/rate-limit'

export async function POST(request: NextRequest) {
  const rateLimitResult = authRateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const body = await request.json()
    const { email, password } = body as { email?: string; password?: string }

    if (!email || !password) {
      return badRequest('Email and password are required')
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        passwordHash: true,
        role: true,
        isVerified: true,
        isBlocked: true,
        blockedReason: true,
      },
    })

    if (!user) {
      return unauthorized('Invalid email or password')
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return unauthorized('Invalid email or password')
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return unauthorized('Admin access required')
    }

    if (user.isBlocked) {
      const message = user.blockedReason
        ? `Account blocked: ${user.blockedReason}`
        : 'Account blocked'
      return unauthorized(message)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })

    const accessToken = signToken(
      { userId: user.id, email: user.email, role: user.role.toLowerCase() },
      '15m'
    )

    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.NEXTAUTH_SECRET
    if (!refreshSecret) {
      return serverError('JWT_REFRESH_SECRET environment variable is required')
    }
    const jwt = await import('jsonwebtoken')
    const refreshToken = jwt.default.sign(
      { userId: user.id, email: user.email, role: user.role.toLowerCase() },
      refreshSecret,
      { expiresIn: '7d' }
    )

    await prisma.session.create({
      data: {
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
      },
    })

    return success({
      token: accessToken,
      refreshToken,
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatarUrl,
      bio: user.bio,
      role: user.role.toLowerCase(),
    })
  } catch (error) {
    return serverError(error)
  }
}
