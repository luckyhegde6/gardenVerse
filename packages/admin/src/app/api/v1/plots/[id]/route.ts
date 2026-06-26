import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, badRequest, notFound, unauthorized, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const userId = auth.payload.userId

    const garden = await prisma.garden.findFirst({
      where: { id: params.id, userId },
      include: {
        _count: { select: { crops: true } },
        crops: {
          select: {
            id: true,
            name: true,
            species: true,
            status: true,
            health: true,
            hydration: true,
            nutrientLevel: true,
            growthStage: true,
            plotX: true,
            plotY: true,
            plantedAt: true,
            estimatedHarvest: true,
          },
        },
        plotPurchases: {
          select: {
            id: true,
            price: true,
            tokenType: true,
            plotNumber: true,
            purchasedAt: true,
          },
        },
        soilChecks: {
          orderBy: { checkedAt: 'desc' },
          take: 5,
        },
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            maxPlots: true,
            plotPurchaseCount: true,
          },
        },
      },
    })

    if (!garden) {
      return notFound('Plot not found')
    }

    return success({
      id: garden.id,
      name: garden.name,
      type: garden.type,
      description: garden.description,
      plotNumber: garden.plotNumber,
      isPurchased: garden.isPurchased,
      purchasedAt: garden.purchasedAt,
      purchasePrice: garden.purchasePrice,
      soilQuality: garden.soilQuality,
      soilLastCheckedAt: garden.soilLastCheckedAt,
      soilQualityHistory: garden.soilQualityHistory,
      gridWidth: garden.gridWidth,
      gridHeight: garden.gridHeight,
      irrigationLevel: garden.irrigationLevel,
      irrigationType: garden.irrigationType,
      wateringMode: garden.wateringMode,
      sunlightExposure: garden.sunlightExposure,
      plantMoveCount: garden.plantMoveCount,
      cropCount: garden._count.crops,
      crops: garden.crops,
      plotPurchases: garden.plotPurchases,
      recentSoilChecks: garden.soilChecks,
      user: garden.user,
      createdAt: garden.createdAt,
      updatedAt: garden.updatedAt,
    })
  } catch (error) {
    return serverError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const userId = auth.payload.userId
    const role = auth.payload.role

    const garden = await prisma.garden.findUnique({ where: { id: params.id } })
    if (!garden) return notFound('Plot not found')

    // Verify ownership (admins can update any)
    if (garden.userId !== userId && role.toUpperCase() !== 'ADMIN' && role.toUpperCase() !== 'SUPER_ADMIN') {
      return unauthorized('Not authorized to update this plot')
    }

    const body = await request.json()
    const allowedFields = [
      'name', 'description', 'gridWidth', 'gridHeight',
      'irrigationType', 'wateringMode', 'hasMotorPump',
      'soilQuality', 'irrigationLevel', 'sunlightExposure',
      'theme', 'address', 'timezone', 'latitude', 'longitude',
    ]

    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0) {
      return badRequest('No valid fields to update')
    }

    const updated = await prisma.garden.update({
      where: { id: params.id },
      data,
      include: {
        _count: { select: { crops: true } },
        crops: {
          select: {
            id: true,
            name: true,
            species: true,
            status: true,
            health: true,
            plotX: true,
            plotY: true,
          },
        },
      },
    })

    return success({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      type: updated.type,
      plotNumber: updated.plotNumber,
      isPurchased: updated.isPurchased,
      soilQuality: updated.soilQuality,
      gridWidth: updated.gridWidth,
      gridHeight: updated.gridHeight,
      irrigationLevel: updated.irrigationLevel,
      irrigationType: updated.irrigationType,
      wateringMode: updated.wateringMode,
      hasMotorPump: updated.hasMotorPump,
      sunlightExposure: updated.sunlightExposure,
      theme: updated.theme,
      address: updated.address,
      timezone: updated.timezone,
      latitude: updated.latitude,
      longitude: updated.longitude,
      cropCount: updated._count.crops,
      crops: updated.crops,
      updatedAt: updated.updatedAt,
    })
  } catch (error) {
    return serverError(error)
  }
}
