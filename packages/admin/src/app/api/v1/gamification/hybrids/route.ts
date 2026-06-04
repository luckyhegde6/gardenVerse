import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

/**
 * GET /api/v1/gamification/hybrids
 * Returns all plant hybrids created/discovered by the authenticated user
 */
export async function GET(request: NextRequest) {
  const logCtx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(logCtx, request, 401)
    return auth.error
  }

  const userId = auth.payload.userId

  try {
    const hybrids = await prisma.plantHybrid.findMany({
      where: { discoveredById: userId },
      include: {
        parent1: {
          select: { id: true, commonName: true, imageUrl: true },
        },
        parent2: {
          select: { id: true, commonName: true, imageUrl: true },
        },
        resultSpecies: {
          select: { id: true, commonName: true, imageUrl: true, difficulty: true },
        },
      },
      orderBy: { discoveredAt: 'desc' },
    })

    const result = hybrids.map(h => ({
      id: h.id,
      parent1: h.parent1,
      parent2: h.parent2,
      resultSpecies: h.resultSpecies,
      discoveredAt: h.discoveredAt,
    }))

    finishRequestLog(logCtx, request, 200)
    return success(result)
  } catch (error) {
    logApiError(logCtx, request, error)
    return serverError(error)
  }
}
