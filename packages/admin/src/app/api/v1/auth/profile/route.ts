import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, unauthorized, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const user = await prisma.user.findUnique({
      where: { id: auth.payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        region: true,
        geohash: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveAt: true,
        createdAt: true,
      },
    })

    if (!user) {
      return unauthorized('User not found')
    }

    return success(user)
  } catch (error) {
    return serverError(error)
  }
}
