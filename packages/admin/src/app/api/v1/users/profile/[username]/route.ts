import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, notFound, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const ctx = startRequestLog(request)

  try {
    const { username } = params

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isVerified: true,
        region: true,
        createdAt: true,
        _count: {
          select: {
            crops: true,
          },
        },
      },
    })

    if (!user) {
      finishRequestLog(ctx, request, 404)
      return notFound('User not found')
    }

    // Count gardens separately (gardens is optional 1:1, not an array)
    const garden = await prisma.garden.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })

    const profile = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      isVerified: user.isVerified,
      region: user.region,
      createdAt: user.createdAt,
      gardenCount: garden ? 1 : 0,
      cropCount: user._count?.crops ?? 0,
    }

    finishRequestLog(ctx, request, 200)
    return success(profile)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
