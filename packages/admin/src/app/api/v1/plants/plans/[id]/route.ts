import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError, notFound } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const { id } = params

    const plan = await prisma.gardenPlan.findUnique({
      where: { id },
      include: {
        plants: {
          include: { species: true },
          orderBy: [{ plotY: 'asc' as const }, { plotX: 'asc' as const }],
        },
      },
    })

    if (!plan) {
      finishRequestLog(ctx, request, 404)
      return notFound('Garden plan not found')
    }

    finishRequestLog(ctx, request, 200)
    return success(plan)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
