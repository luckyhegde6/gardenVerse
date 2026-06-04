import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

const OPTIMAL_MOISTURE = 60

export async function GET(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const cropId = searchParams.get('cropId')

    // Fetch user with garden and crops
    const user = await prisma.user.findUnique({
      where: { id: auth.payload.userId },
      include: {
        garden: {
          include: {
            crops: {
              ...(cropId ? { where: { id: cropId } } : {}),
            },
          },
        },
      },
    })

    if (!user?.garden) {
      finishRequestLog(ctx, request, 400)
      return badRequest('No garden found')
    }

    if (user.garden.crops.length === 0) {
      finishRequestLog(ctx, request, 400)
      return badRequest('No crops found')
    }

    // Fetch latest weather for user's region
    const weather = await prisma.weatherRecord.findFirst({
      where: user.region ? { region: { contains: user.region, mode: 'insensitive' } } : {},
      orderBy: { recordedAt: 'desc' },
    })

    // Calculate watering recommendations for each crop
    const recommendations = user.garden.crops.map((crop) => {
      const moistureDeficit = OPTIMAL_MOISTURE - crop.hydration
      const shouldWater = moistureDeficit > 20

      // Temperature factor
      const temp = weather?.temperature ?? 22
      const tempFactor = temp > 30 ? 1.5 : temp > 25 ? 1.2 : temp < 15 ? 0.7 : 1.0

      // Rain factor
      const rainFactor = weather && weather.rainfall > 5 ? 0.5 : 1

      const amount = Math.max(0, Math.round(moistureDeficit * 10 * tempFactor * rainFactor))
      const urgency = moistureDeficit > 40 ? 'HIGH' : moistureDeficit > 20 ? 'MEDIUM' : 'LOW'

      // Determine best watering time
      const hour = new Date().getHours()
      let bestTime: string
      if (hour < 6 || hour > 18) bestTime = 'Now — early morning is ideal'
      else if (hour < 10) bestTime = 'Now — morning watering is optimal'
      else if (hour < 16) bestTime = 'Wait until evening (after 6 PM) to reduce evaporation'
      else bestTime = 'Now — evening watering is good'

      // Generate reason
      let reason: string
      if (moistureDeficit > 40) reason = `Critical: ${crop.name} needs immediate watering`
      else if (moistureDeficit > 20) reason = `Moisture levels are low — time to water ${crop.name}`
      else if (weather?.rainfall && weather.rainfall > 10) reason = 'Recent rainfall has provided adequate moisture'
      else reason = `${crop.name} moisture levels are adequate`

      return {
        cropId: crop.id,
        cropName: crop.name,
        shouldWater,
        amount,
        unit: 'ml',
        bestTime,
        urgency,
        reason,
      }
    })

    finishRequestLog(ctx, request, 200)
    return success(recommendations)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
