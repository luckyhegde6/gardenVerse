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

    const reports = await prisma.moderationReport.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        actionedBy: { select: { id: true, username: true, displayName: true } },
      },
    })

    finishRequestLog(ctx, request, 200)
    return success(reports)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
