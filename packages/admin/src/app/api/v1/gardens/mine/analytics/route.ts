import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, notFound, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function GET(request: NextRequest) {
  const ctx = startRequestLog(request)
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const garden = await prisma.garden.findFirst({
      where: { userId: auth.payload.userId },
      orderBy: { plotNumber: 'asc' },
      include: {
        crops: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!garden) {
      finishRequestLog(ctx, request, 404)
      return notFound('Garden not found')
    }

    const crops = garden.crops
    const totalCrops = crops.length

    // Crop stats by status
    const statusCounts: Record<string, number> = {}
    for (const crop of crops) {
      statusCounts[crop.status] = (statusCounts[crop.status] || 0) + 1
    }

    const healthyCrops = crops.filter(c => c.health > 70).length
    const diseasedCrops = crops.filter(c => c.status === 'DISEASED').length
    const matureCrops = crops.filter(c => c.status === 'MATURE').length
    const harvestedCrops = crops.filter(c => c.status === 'HARVESTED').length
    const wiltedCrops = crops.filter(c => c.status === 'WILTED').length
    const sproutingCrops = crops.filter(c => c.status === 'SPROUTING' || c.status === 'GROWING').length

    // Hydration trend — last 5 crops by planted date
    const hydrationTrend = crops
      .slice()
      .sort((a, b) => b.plantedAt.getTime() - a.plantedAt.getTime())
      .slice(0, 5)
      .map(c => ({
        cropId: c.id,
        cropName: c.name,
        hydration: c.hydration,
        status: c.status,
      }))

    // Nutrient trend — same approach
    const nutrientTrend = crops
      .slice()
      .sort((a, b) => b.plantedAt.getTime() - a.plantedAt.getTime())
      .slice(0, 5)
      .map(c => ({
        cropId: c.id,
        cropName: c.name,
        nutrientLevel: c.nutrientLevel,
        status: c.status,
      }))

    // Average growth stage
    const activeCrops = crops.filter(c => !['HARVESTED', 'WILTED'].includes(c.status))
    const growthRate = totalCrops > 0
      ? Math.round((activeCrops.reduce((sum, c) => sum + c.growthStage, 0) / totalCrops) * 10) / 10
      : 0

    // Average health across all active crops
    const averageHealth = activeCrops.length > 0
      ? Math.round((activeCrops.reduce((sum, c) => sum + c.health, 0) / activeCrops.length) * 10) / 10
      : 0

    // Average hydration
    const averageHydration = activeCrops.length > 0
      ? Math.round((activeCrops.reduce((sum, c) => sum + c.hydration, 0) / activeCrops.length) * 10) / 10
      : 0

    // Average nutrient level
    const averageNutrient = activeCrops.length > 0
      ? Math.round((activeCrops.reduce((sum, c) => sum + c.nutrientLevel, 0) / activeCrops.length) * 10) / 10
      : 0

    // Harvest history — last 10 harvested crops
    const harvestHistory = crops
      .filter(c => c.status === 'HARVESTED' && c.harvestedAt)
      .sort((a, b) => (b.harvestedAt?.getTime() ?? 0) - (a.harvestedAt?.getTime() ?? 0))
      .slice(0, 10)
      .map(c => ({
        cropId: c.id,
        cropName: c.name,
        harvestedAt: c.harvestedAt?.toISOString() ?? null,
        health: c.health,
      }))

    const analytics = {
      gardenId: garden.id,
      gardenName: garden.name,
      totalCrops,
      statusBreakdown: statusCounts,
      healthyCrops,
      diseasedCrops,
      matureCrops,
      harvestedCrops,
      wiltedCrops,
      sproutingCrops,
      healthPercentage: totalCrops > 0 ? Math.round((healthyCrops / totalCrops) * 100) : 0,
      soilQuality: garden.soilQuality,
      irrigationLevel: garden.irrigationLevel,
      sunlightExposure: garden.sunlightExposure,
      growthRate,
      averageHealth,
      averageHydration,
      averageNutrient,
      hydrationTrend,
      nutrientTrend,
      harvestHistory,
    }

    finishRequestLog(ctx, request, 200)
    return success(analytics)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
