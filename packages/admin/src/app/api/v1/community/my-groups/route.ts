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
    const userId = auth.payload.userId

    const groups = await prisma.group.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        _count: { select: { members: true, messages: true } },
        members: {
          where: { userId },
          select: { role: true, joinedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = groups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      type: g.type,
      isPrivate: g.isPrivate,
      region: g.region,
      memberCount: g._count.members,
      messageCount: g._count.messages,
      myRole: g.members[0]?.role || 'MEMBER',
      joinedAt: g.members[0]?.joinedAt.toISOString(),
      createdAt: g.createdAt.toISOString(),
    }))

    finishRequestLog(ctx, request, 200)
    return success(mapped)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
