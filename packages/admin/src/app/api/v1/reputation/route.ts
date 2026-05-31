import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return badRequest('userId query parameter is required')
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        trustScore: true,
        marketplaceReliability: true,
        communityStanding: true,
        sustainabilityScore: true,
        reputationTokens: true,
      },
    })

    if (!user) {
      return notFound('User not found')
    }

    return success(user)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { userId, action, scoreChange, reason } = body as Record<string, unknown>

    if (!userId || !action || scoreChange === undefined || scoreChange === null) {
      return badRequest('userId, action, and scoreChange are required')
    }

    const user = await prisma.user.findUnique({ where: { id: userId as string }, select: { id: true } })
    if (!user) {
      return notFound('User not found')
    }

    const [log] = await prisma.$transaction([
      prisma.reputationLog.create({
        data: {
          userId: userId as string,
          action: action as string,
          scoreChange: Number(scoreChange),
          reason: (reason as string) || 'Admin adjustment',
        },
      }),
      prisma.user.update({
        where: { id: userId as string },
        data: {
          trustScore: { increment: Number(scoreChange) },
          communityStanding: { increment: Number(scoreChange) * 0.5 },
          reputationTokens: { increment: Number(scoreChange) * 2 },
        },
      }),
    ])

    return success(log, 201)
  } catch (error) {
    return serverError(error)
  }
}
