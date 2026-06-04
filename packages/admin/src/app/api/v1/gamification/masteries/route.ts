import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

const MASTERY_XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000]

/**
 * GET /api/v1/gamification/masteries
 * Returns all species masteries for the authenticated user
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
    const masteries = await prisma.speciesMastery.findMany({
      where: { userId },
      include: {
        species: {
          select: {
            id: true,
            commonName: true,
            imageUrl: true,
            difficulty: true,
          },
        },
      },
      orderBy: { level: 'desc' },
    })

    const result = masteries.map(m => {
      const level = m.level
      const xpForNext = MASTERY_XP_THRESHOLDS[level] ?? MASTERY_XP_THRESHOLDS[MASTERY_XP_THRESHOLDS.length - 1] + 5000
      return {
        id: m.id,
        speciesId: m.speciesId,
        speciesName: m.species.commonName,
        imageUrl: m.species.imageUrl,
        difficulty: m.species.difficulty,
        level: m.level,
        experience: m.experience,
        xpForNextLevel: xpForNext,
        progress: Math.min(100, Math.round((m.experience / xpForNext) * 100)),
        plantCount: m.plantCount,
        harvestCount: m.harvestCount,
        perfected: !!m.perfectedAt,
        perfectedAt: m.perfectedAt,
      }
    })

    finishRequestLog(logCtx, request, 200)
    return success(result)
  } catch (error) {
    logApiError(logCtx, request, error)
    return serverError(error)
  }
}
