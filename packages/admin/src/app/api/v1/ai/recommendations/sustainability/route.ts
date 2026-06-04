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

    // Fetch user with garden info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { garden: true },
    })

    if (!user) {
      finishRequestLog(ctx, request, 200)
      return success({ tips: [], score: { current: 0, max: 100 } })
    }

    const tips: Array<{
      title: string
      description: string
      impact: number
      effort: 'LOW' | 'MEDIUM' | 'HIGH'
    }> = []

    // Garden type tip
    if (user.garden?.type === 'VIRTUAL') {
      tips.push({
        title: 'Start a Real Garden',
        description: 'Link a real garden to earn double sustainability points',
        impact: 50,
        effort: 'HIGH',
      })
    }

    // Soil quality tip
    if (user.garden?.soilQuality !== null && user.garden?.soilQuality !== undefined && user.garden.soilQuality < 50) {
      tips.push({
        title: 'Improve Soil Quality',
        description: 'Add compost and organic matter to boost soil health',
        impact: 30,
        effort: 'MEDIUM',
      })
    }

    // Streak tip
    if (user.currentStreak > 0) {
      tips.push({
        title: `Maintain Your ${user.currentStreak}-Day Streak`,
        description: 'Log in daily to earn streak bonuses and sustainability rewards',
        impact: Math.min(40, user.currentStreak),
        effort: 'LOW',
      })
    }

    // Recent harvests tip
    const recentHarvests = await prisma.crop.count({
      where: {
        userId,
        status: 'HARVESTED',
        harvestedAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
    })

    if (recentHarvests > 0) {
      tips.push({
        title: 'Share Your Harvest on Marketplace',
        description: `You harvested ${recentHarvests} crops this month — list extras on the marketplace`,
        impact: 25,
        effort: 'LOW',
      })
    }

    // IoT sensor tip
    const deviceCount = await prisma.iotDevice.count({ where: { userId } })
    if (deviceCount > 0) {
      tips.push({
        title: 'Optimize Based on Sensor Data',
        description: `Your ${deviceCount} sensor(s) can help reduce water usage by up to 30%`,
        impact: 40,
        effort: 'LOW',
      })
    } else {
      tips.push({
        title: 'Use IoT Sensors',
        description: 'Connect soil moisture sensors to optimize water usage and reduce waste',
        impact: 35,
        effort: 'MEDIUM',
      })
    }

    // Companion planting tip
    const cropCount = await prisma.crop.count({
      where: { userId, status: { notIn: ['HARVESTED', 'WILTED'] } },
    })
    if (cropCount >= 3) {
      tips.push({
        title: 'Try Companion Planting',
        description: 'Plant compatible species together to improve yields and reduce pests naturally',
        impact: 20,
        effort: 'MEDIUM',
      })
    }

    // Water conservation tip
    if (user.garden?.irrigationLevel !== null && user.garden?.irrigationLevel !== undefined && user.garden.irrigationLevel < 40) {
      tips.push({
        title: 'Improve Irrigation Efficiency',
        description: 'Switch to drip irrigation to reduce water usage by up to 50%',
        impact: 35,
        effort: 'MEDIUM',
      })
    }

    // Calculate score component
    let score = 0
    if (user.garden?.type === 'REAL' || user.garden?.type === 'HYBRID') score += 20
    if (user.garden?.soilQuality && user.garden.soilQuality >= 60) score += 15
    if (user.currentStreak >= 7) score += 10
    if (recentHarvests > 0) score += 10
    if (deviceCount > 0) score += 15
    if (cropCount >= 5) score += 10
    score += Math.min(20, Math.floor((user.experience || 0) / 100))

    finishRequestLog(ctx, request, 200)
    return success({
      tips,
      score: {
        current: Math.min(100, score),
        max: 100,
        level: score >= 80 ? 'GOLD' : score >= 50 ? 'SILVER' : score >= 25 ? 'BRONZE' : 'BEGINNER',
      },
    })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
