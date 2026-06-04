import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function POST(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const body = await request.json()
    const { event, properties } = body as Record<string, unknown>

    if (!event || typeof event !== 'string') {
      finishRequestLog(ctx, request, 400)
      return badRequest('event is required and must be a string')
    }

    // Persist the analytics event as an audit log entry
    await prisma.auditLog.create({
      data: {
        action: `event:${event}`,
        entity: 'analytics',
        entityId: auth.payload.userId,
        changes: properties || undefined,
        userId: auth.payload.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      },
    })

    finishRequestLog(ctx, request, 200)
    return success({ tracked: true })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
