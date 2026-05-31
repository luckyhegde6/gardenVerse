import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { signToken, success, badRequest, unauthorized, serverError } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body as { refreshToken?: string }

    if (!refreshToken) {
      return badRequest('Refresh token is required')
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.NEXTAUTH_SECRET || 'fallback'
    let payload: { userId: string; email: string; role: string }

    try {
      const jwt = await import('jsonwebtoken')
      payload = jwt.default.verify(refreshToken, refreshSecret) as typeof payload
    } catch {
      return unauthorized('Invalid or expired refresh token')
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      return unauthorized('User not found')
    }

    const newAccessToken = signToken(
      { userId: user.id, email: user.email, role: user.role.toLowerCase() },
      '15m'
    )

    const jwt = await import('jsonwebtoken')
    const newRefreshToken = jwt.default.sign(
      { userId: user.id, email: user.email, role: user.role.toLowerCase() },
      refreshSecret,
      { expiresIn: '7d' }
    )

    await prisma.session.create({
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
      },
    })

    return success({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    })
  } catch (error) {
    return serverError(error)
  }
}
