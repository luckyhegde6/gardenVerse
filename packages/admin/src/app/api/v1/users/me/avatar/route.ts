import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function PATCH(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const body = await request.json()
    const { avatarUrl } = body

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      finishRequestLog(ctx, request, 400)
      return badRequest('avatarUrl is required and must be a string')
    }

    const user = await prisma.user.update({
      where: { id: auth.payload.userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isVerified: true,
        isOnboarded: true,
        region: true,
        createdAt: true,
      },
    })

    finishRequestLog(ctx, request, 200)
    return success(user)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
