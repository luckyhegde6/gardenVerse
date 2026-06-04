import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError, notFound } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

function getCurrentSeason(): string {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'fall'
  return 'winter'
}

function calculateMatchScore(plant: Record<string, unknown>, garden: Record<string, unknown>): number {
  let score = 50
  if (plant.difficulty === 'EASY') score += 15
  if (Number(garden.soilQuality) > 60) score += 10
  if (Number(garden.sunlightExposure) > 60 && plant.sunlightNeeds === 'FULL_SUN') score += 10
  if (Number(garden.irrigationLevel) > 60 && plant.waterNeeds === 'HIGH') score += 5
  return score
}

function getPlantReason(plant: Record<string, unknown>, season: string, garden: Record<string, unknown>): string {
  if (plant.difficulty === 'EASY') return 'Easy to grow — great for beginners'
  if (plant.difficulty === 'HARD') return 'Requires experience — rewarding challenge'
  if (plant.sunlightNeeds === 'FULL_SUN' && Number(garden.sunlightExposure) > 60) return 'Thrives in your sunny garden'
  if (plant.waterNeeds === 'LOW' && Number(garden.irrigationLevel) < 40) return 'Drought-tolerant — ideal for your setup'
  return `Perfect for ${season} planting`
}

export async function GET(
  request: NextRequest,
  { params }: { params: { gardenId: string } },
) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const { gardenId } = params

    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
    })

    if (!garden) {
      finishRequestLog(ctx, request, 404)
      return notFound('Garden not found')
    }

    const season = getCurrentSeason()

    const plants = await prisma.plantSpecies.findMany({
      where: {
        seasons: { has: season },
      },
      orderBy: { difficulty: 'asc' },
      take: 10,
    })

    const recommendations = plants
      .map(p => {
        const plantRecord = p as unknown as Record<string, unknown>
        const gardenRecord = garden as unknown as Record<string, unknown>
        return {
          ...p,
          matchScore: calculateMatchScore(plantRecord, gardenRecord),
          reason: getPlantReason(plantRecord, season, gardenRecord),
        }
      })
      .sort((a, b) => b.matchScore - a.matchScore)

    finishRequestLog(ctx, request, 200)
    return success({ season, recommendations })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
