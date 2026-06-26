import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

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
        gardens: {
          include: {
            crops: {
              ...(cropId ? { where: { id: cropId } } : {}),
            },
          },
        },
      },
    })

    const firstGarden = user?.gardens?.[0]

    if (!firstGarden) {
      finishRequestLog(ctx, request, 400)
      return badRequest('No garden found')
    }

    const crops = firstGarden.crops ?? []

    if (crops.length === 0) {
      finishRequestLog(ctx, request, 400)
      return badRequest('No crops found')
    }

    // Calculate fertilizer recommendations for each crop
    const recommendations = crops.map((crop) => {
      const nutrientDeficit = 50 - crop.nutrientLevel
      const shouldFertilize = nutrientDeficit > 15
      const growthStage = crop.status

      // Determine fertilizer type based on growth stage
      let fertilizerType: string
      if (growthStage === 'SEED' || growthStage === 'SPROUTING') fertilizerType = 'Balanced NPK (10-10-10)'
      else if (growthStage === 'GROWING') fertilizerType = 'High-Nitrogen Fertilizer (20-10-10)'
      else if (growthStage === 'MATURE') fertilizerType = 'High-Phosphorus Fertilizer (10-20-10)'
      else fertilizerType = 'Organic Compost'

      const amount = Math.max(1, Math.round(Math.abs(nutrientDeficit) / 10))

      // Generate reason
      let reason: string
      if (nutrientDeficit > 30) reason = 'Severe nutrient deficiency detected'
      else if (nutrientDeficit > 15) reason = 'Nutrient levels are below optimal'
      else if (growthStage === 'GROWING') reason = 'Growth stage requires additional nutrients'
      else if (growthStage === 'MATURE') reason = 'Mature plants need phosphorus for fruit development'
      else reason = 'Nutrient levels are adequate — maintain current schedule'

      const frequency = shouldFertilize ? 'Every 14 days' : 'Every 30 days'

      return {
        cropId: crop.id,
        cropName: crop.name,
        shouldFertilize,
        fertilizerType,
        amount,
        unit: 'g',
        frequency,
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
