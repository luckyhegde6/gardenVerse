import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function GET(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || undefined
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    const where = region ? { region, deletedAt: null } : { deletedAt: null }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { experience: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          level: true,
          experience: true,
          sustainabilityScore: true,
          greenCredits: true,
          region: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    const entries = users.map((user, index) => ({
      rank: offset + index + 1,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      level: user.level,
      experience: user.experience,
      sustainabilityScore: user.sustainabilityScore,
      greenCredits: user.greenCredits,
      region: user.region,
    }))

    finishRequestLog(ctx, request, 200)
    return success({ entries, total, limit, offset })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
