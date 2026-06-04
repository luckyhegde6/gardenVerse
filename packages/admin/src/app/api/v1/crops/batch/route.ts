import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, badRequest, notFound, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

interface Planting {
  gardenId: string
  speciesId: string
  plotX: number
  plotY: number
}

export async function POST(request: NextRequest) {
  const ctx = startRequestLog(request)
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { plantings } = body as { plantings: Planting[] }

    if (!Array.isArray(plantings) || plantings.length === 0) {
      finishRequestLog(ctx, request, 400)
      return badRequest('plantings array is required and must not be empty')
    }

    if (plantings.length > 50) {
      finishRequestLog(ctx, request, 400)
      return badRequest('Cannot plant more than 50 crops at once')
    }

    // Validate each planting entry
    for (let i = 0; i < plantings.length; i++) {
      const p = plantings[i]
      if (!p.gardenId) {
        finishRequestLog(ctx, request, 400)
        return badRequest(`plantings[${i}].gardenId is required`)
      }
      if (!p.speciesId) {
        finishRequestLog(ctx, request, 400)
        return badRequest(`plantings[${i}].speciesId is required`)
      }
      if (p.plotX === undefined || p.plotX === null || p.plotY === undefined || p.plotY === null) {
        finishRequestLog(ctx, request, 400)
        return badRequest(`plantings[${i}].plotX and plotY are required`)
      }
    }

    // Verify all gardens belong to the current user
    const gardenIds = Array.from(new Set(plantings.map(p => p.gardenId)))
    const gardens = await prisma.garden.findMany({
      where: { id: { in: gardenIds } },
    })

    const gardenMap = new Map(gardens.map(g => [g.id, g]))
    for (const gardenId of gardenIds) {
      const garden = gardenMap.get(gardenId)
      if (!garden) {
        finishRequestLog(ctx, request, 404)
        return notFound(`Garden ${gardenId} not found`)
      }
      if (garden.userId !== auth.payload.userId) {
        finishRequestLog(ctx, request, 403)
        return badRequest(`Garden ${gardenId} does not belong to current user`)
      }
    }

    // Verify all species exist
    const speciesIds = Array.from(new Set(plantings.map(p => p.speciesId)))
    const species = await prisma.plantSpecies.findMany({
      where: { id: { in: speciesIds } },
    })
    const speciesMap = new Map(species.map(s => [s.id, s]))
    for (const speciesId of speciesIds) {
      if (!speciesMap.has(speciesId)) {
        finishRequestLog(ctx, request, 404)
        return notFound(`Plant species ${speciesId} not found`)
      }
    }

    const estimatedHarvest = new Date()
    estimatedHarvest.setDate(estimatedHarvest.getDate() + 7)

    // Use $transaction for atomicity
    const crops = await prisma.$transaction(
      plantings.map((p) =>
        prisma.crop.create({
          data: {
            name: speciesMap.get(p.speciesId)?.commonName ?? 'Unknown Plant',
            speciesId: p.speciesId,
            status: 'SEED',
            gardenId: p.gardenId,
            userId: auth.payload.userId,
            estimatedHarvest,
            plotX: p.plotX,
            plotY: p.plotY,
          },
        }),
      ),
    )

    finishRequestLog(ctx, request, 201)
    return success({
      planted: crops.length,
      crops,
    }, 201)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
