import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, badRequest, notFound, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function POST(request: NextRequest) {
  const ctx = startRequestLog(request)
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { cropIds } = body as { cropIds: string[] }

    if (!Array.isArray(cropIds) || cropIds.length === 0) {
      finishRequestLog(ctx, request, 400)
      return badRequest('cropIds array is required and must not be empty')
    }

    if (cropIds.length > 100) {
      finishRequestLog(ctx, request, 400)
      return badRequest('Cannot fertilize more than 100 crops at once')
    }

    // Fetch all crops and verify ownership in one query
    const crops = await prisma.crop.findMany({
      where: {
        id: { in: cropIds },
        status: { notIn: ['HARVESTED', 'WILTED'] },
      },
    })

    if (crops.length === 0) {
      finishRequestLog(ctx, request, 404)
      return notFound('No active crops found for the given IDs')
    }

    // Verify all crops belong to the current user
    const unauthorizedIds = crops
      .filter(c => c.userId !== auth.payload.userId)
      .map(c => c.id)

    if (unauthorizedIds.length > 0) {
      finishRequestLog(ctx, request, 403)
      return badRequest(`Crops ${unauthorizedIds.join(', ')} do not belong to current user`)
    }

    // Check for missing/invalid IDs
    const foundIds = new Set(crops.map(c => c.id))
    const missingIds = cropIds.filter(id => !foundIds.has(id))
    if (missingIds.length > 0) {
      finishRequestLog(ctx, request, 404)
      return notFound(`Crops not found or inactive: ${missingIds.join(', ')}`)
    }

    const now = new Date()

    // Update all crops in a transaction
    const updated = await prisma.$transaction(
      crops.map(crop => {
        const nutrientLevel = Math.min(100, crop.nutrientLevel + 40)
        return prisma.crop.update({
          where: { id: crop.id },
          data: {
            nutrientLevel,
            lastFertilizedAt: now,
          },
        })
      }),
    )

    finishRequestLog(ctx, request, 200)
    return success({
      fertilized: updated.length,
      crops: updated,
    })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
