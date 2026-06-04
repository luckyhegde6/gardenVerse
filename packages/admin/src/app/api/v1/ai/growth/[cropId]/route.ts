import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, notFound, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function GET(
  request: NextRequest,
  { params }: { params: { cropId: string } }
) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const { cropId } = params

    // Fetch crop belonging to the authenticated user
    const crop = await prisma.crop.findFirst({
      where: { id: cropId, userId: auth.payload.userId },
      include: { plantSpecies: true },
    })

    if (!crop) {
      finishRequestLog(ctx, request, 404)
      return notFound('Crop not found')
    }

    const daysSincePlanted = Math.floor(
      (Date.now() - crop.plantedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    const growthProgress = crop.growthStage

    // Identify issues
    const issues: string[] = []
    if (crop.health < 40) issues.push('Low health — check for disease or nutrient deficiency')
    if (crop.hydration < 25) issues.push('Underwatered — increase irrigation')
    if (crop.nutrientLevel < 25) issues.push('Low nutrients — apply fertilizer')
    if (crop.weatherStressed) issues.push('Crop is weather-stressed — check protective measures')
    if (crop.stressFactor > 50) issues.push('High stress factor detected — review growing conditions')

    // Generate recommendations
    const recommendations: string[] = []
    if (crop.hydration < 40) recommendations.push('Increase watering — soil moisture is low')
    if (crop.nutrientLevel < 40) recommendations.push('Apply fertilizer to boost nutrient levels')
    if (crop.health < 50) recommendations.push('Check for pests and diseases')
    if (crop.growthStage > 80) recommendations.push('Crop is nearing maturity — prepare for harvest')

    if (crop.plantSpecies?.growingDays) {
      const remaining = crop.plantSpecies.growingDays - daysSincePlanted
      if (remaining <= 7 && remaining > 0) {
        recommendations.push(`Only ${remaining} days to harvest — check readiness daily`)
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Crop is on track — continue regular care')
    }

    const analysis = {
      cropId: crop.id,
      species: crop.name,
      scientificName: crop.plantSpecies?.scientificName ?? null,
      daysSincePlanted,
      currentStage: crop.status,
      growthProgress,
      healthStatus: crop.health > 70 ? 'HEALTHY' as const : crop.health > 40 ? 'STRESSED' as const : 'CRITICAL' as const,
      health: crop.health,
      hydration: crop.hydration,
      nutrientLevel: crop.nutrientLevel,
      stressFactor: crop.stressFactor,
      careStreak: crop.careStreak,
      estimatedDaysToMaturity: crop.plantSpecies?.growingDays
        ? Math.max(0, crop.plantSpecies.growingDays - daysSincePlanted)
        : null,
      issues,
      recommendations,
    }

    finishRequestLog(ctx, request, 200)
    return success(analysis)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
