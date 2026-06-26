import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, badRequest, notFound, forbidden, serverError } from '@/lib/middleware/auth'

const MOVE_CROP_MIN_LEVEL = 3
const CROSS_GARDEN_MIN_LEVEL = 5

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const userId = auth.payload.userId

    // Verify user level
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { level: true, greenCredits: true },
    })
    if (!user) return notFound('User not found')

    if (user.level < MOVE_CROP_MIN_LEVEL) {
      return forbidden(`Level ${MOVE_CROP_MIN_LEVEL}+ required to move crops. Your level: ${user.level}`)
    }

    // Verify garden ownership
    const garden = await prisma.garden.findFirst({
      where: { id: params.id, userId },
      select: { id: true, plantMoveCount: true, gridWidth: true, gridHeight: true },
    })
    if (!garden) return notFound('Plot not found')

    const body = await request.json()
    const { cropId, targetPlotX, targetPlotY, targetGardenId } = body

    if (!cropId) return badRequest('cropId is required')
    if (targetPlotX === undefined || targetPlotY === undefined) {
      return badRequest('targetPlotX and targetPlotY are required')
    }

    // Verify crop exists and belongs to user
    const crop = await prisma.crop.findFirst({
      where: { id: cropId, userId },
      select: { id: true, gardenId: true, plotX: true, plotY: true, name: true },
    })
    if (!crop) return notFound('Crop not found')

    let targetGardenIdFinal = params.id

    if (targetGardenId) {
      // Cross-garden move
      if (user.level < CROSS_GARDEN_MIN_LEVEL) {
        return forbidden(`Level ${CROSS_GARDEN_MIN_LEVEL}+ required to move crops between gardens. Your level: ${user.level}`)
      }

      // Verify target garden exists and belongs to user
      const targetGarden = await prisma.garden.findFirst({
        where: { id: targetGardenId, userId },
        select: { id: true, gridWidth: true, gridHeight: true },
      })
      if (!targetGarden) return badRequest('Target garden not found or does not belong to you')

      targetGardenIdFinal = targetGarden.id
    }

    // Validate coordinates within grid bounds
    const targetGardenData = targetGardenId === params.id
      ? garden
      : await prisma.garden.findUnique({ where: { id: targetGardenIdFinal }, select: { gridWidth: true, gridHeight: true } })

    const gridW = targetGardenData?.gridWidth ?? 6
    const gridH = targetGardenData?.gridHeight ?? 6

    if (targetPlotX < 0 || targetPlotX >= gridW || targetPlotY < 0 || targetPlotY >= gridH) {
      return badRequest(`Target position (${targetPlotX}, ${targetPlotY}) is out of bounds for a ${gridW}×${gridH} grid`)
    }

    // Check if target cell is occupied (by a different crop)
    const existingCrop = await prisma.crop.findFirst({
      where: {
        gardenId: targetGardenIdFinal,
        plotX: targetPlotX,
        plotY: targetPlotY,
        id: { not: cropId },
        status: { notIn: ['HARVESTED', 'WILTED'] },
      },
      select: { id: true },
    })
    if (existingCrop) {
      return badRequest(`Target cell (${targetPlotX}, ${targetPlotY}) is already occupied by another active crop`)
    }

    // Execute the move
    const result = await prisma.$transaction(async (tx) => {
      const updatedCrop = await tx.crop.update({
        where: { id: cropId },
        data: {
          gardenId: targetGardenIdFinal,
          plotX: targetPlotX,
          plotY: targetPlotY,
        },
      })

      // Increment plantMoveCount on the source garden
      await tx.garden.update({
        where: { id: params.id },
        data: { plantMoveCount: { increment: 1 } },
      })

      // If moving to a different garden, also record a TokenTransaction
      if (targetGardenId && targetGardenId !== params.id) {
        await tx.tokenTransaction.create({
          data: {
            type: 'GREEN_CREDITS',
            amount: 0,
            balanceBefore: user.greenCredits,
            balanceAfter: user.greenCredits,
            action: 'crop_move',
            referenceId: cropId,
            referenceType: 'crop_move',
            description: `Moved crop "${crop.name}" from plot ${params.id} to plot ${targetGardenIdFinal} at (${targetPlotX}, ${targetPlotY})`,
            userId,
          },
        })
      }

      return updatedCrop
    })

    return success({
      crop: result,
      message: `Crop moved to (${targetPlotX}, ${targetPlotY})${targetGardenId && targetGardenId !== params.id ? ' across gardens' : ''}`,
    })
  } catch (error) {
    return serverError(error)
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const userId = auth.payload.userId

    const garden = await prisma.garden.findFirst({
      where: { id: params.id, userId },
      select: {
        id: true,
        gridWidth: true,
        gridHeight: true,
        soilQuality: true,
        crops: {
          where: { status: { notIn: ['HARVESTED', 'WILTED'] } },
          select: {
            id: true,
            name: true,
            health: true,
            hydration: true,
            nutrientLevel: true,
            growthStage: true,
            status: true,
            plotX: true,
            plotY: true,
          },
        },
      },
    })
    if (!garden) return notFound('Plot not found')

    // Build a grid occupancy map
    const occupied = new Set<string>()
    const cropMap = new Map<string, typeof garden.crops[0]>()
    for (const c of garden.crops) {
      const key = `${c.plotX},${c.plotY}`
      occupied.add(key)
      cropMap.set(key, c)
    }

    // Find empty cells and generate suggestions
    const suggestions: Array<{
      plotX: number
      plotY: number
      reason: string
      priority: number
    }> = []

    for (let x = 0; x < garden.gridWidth; x++) {
      for (let y = 0; y < garden.gridHeight; y++) {
        if (!occupied.has(`${x},${y}`)) {
          suggestions.push({
            plotX: x,
            plotY: y,
            reason: 'Empty cell available',
            priority: 1,
          })
        }
      }
    }

    // Recommend moving sick crops to better-soil areas (if garden has high soil quality variance)
    // For simplicity, identify the healthiest empty cells near healthy crops
    const healthyCrops = garden.crops.filter((c) => c.health > 70)
    const sickCrops = garden.crops.filter((c) => c.health <= 50)

    // Generate repotting suggestions for sick crops
    const repotSuggestions = sickCrops.map((crop) => {
      // Find nearest empty cell
      let nearest = suggestions[0]
      let minDist = Infinity
      for (const s of suggestions) {
        const dist = Math.abs(s.plotX - (crop.plotX ?? 0)) + Math.abs(s.plotY - (crop.plotY ?? 0))
        if (dist < minDist) {
          minDist = dist
          nearest = s
        }
      }
      return {
        cropId: crop.id,
        cropName: crop.name,
        cropHealth: crop.health,
        currentPosition: { x: crop.plotX, y: crop.plotY },
        suggestedPosition: nearest ? { x: nearest.plotX, y: nearest.plotY } : null,
        reason: crop.health <= 50
          ? 'Crop health is low — consider moving to a different location'
          : 'Standard relocation',
        priority: crop.health <= 30 ? 3 : 2,
      }
    })

    // Available gardens for cross-garden moves (excluding current)
    const availableGardens = await prisma.garden.findMany({
      where: {
        userId,
        id: { not: params.id },
      },
      select: {
        id: true,
        name: true,
        plotNumber: true,
        soilQuality: true,
        _count: { select: { crops: true } },
        gridWidth: true,
        gridHeight: true,
      },
      orderBy: { plotNumber: 'asc' },
    })

    return success({
      gridWidth: garden.gridWidth,
      gridHeight: garden.gridHeight,
      soilQuality: garden.soilQuality,
      activeCrops: garden.crops.length,
      emptyCells: suggestions.length,
      suggestions,
      repotSuggestions,
      availableGardens: availableGardens.map((g) => ({
        id: g.id,
        name: g.name,
        plotNumber: g.plotNumber,
        soilQuality: g.soilQuality,
        cropCount: g._count.crops,
        gridWidth: g.gridWidth,
        gridHeight: g.gridHeight,
      })),
    })
  } catch (error) {
    return serverError(error)
  }
}
