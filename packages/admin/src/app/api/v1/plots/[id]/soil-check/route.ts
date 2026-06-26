import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, badRequest, notFound, serverError, paginated } from '@/lib/middleware/auth'

/**
 * Normalize pH level to a 0-100 quality score.
 * Optimal range: 6.0 - 7.0 (score = 100).
 * Outside that, score drops proportionally.
 */
function scorePhLevel(ph: number): number {
  if (ph >= 6.0 && ph <= 7.0) return 100
  if (ph < 6.0) return Math.max(0, (ph / 6.0) * 100)
  // ph > 7.0
  return Math.max(0, 100 - ((ph - 7.0) / 7.0) * 100)
}

/**
 * Compute overall soil quality score (0-100) from individual measurements.
 * Uses provided values only; missing metrics are skipped.
 */
function computeQualityScore(values: {
  phLevel?: number
  moisture?: number
  nitrogen?: number
  phosphorus?: number
  potassium?: number
  organicMatter?: number
}): number {
  const scores: number[] = []

  if (values.phLevel !== undefined) {
    scores.push(scorePhLevel(values.phLevel))
  }
  if (values.moisture !== undefined) {
    scores.push(Math.min(100, Math.max(0, values.moisture)))
  }
  if (values.nitrogen !== undefined) {
    scores.push(Math.min(100, Math.max(0, values.nitrogen)))
  }
  if (values.phosphorus !== undefined) {
    scores.push(Math.min(100, Math.max(0, values.phosphorus)))
  }
  if (values.potassium !== undefined) {
    scores.push(Math.min(100, Math.max(0, values.potassium)))
  }
  if (values.organicMatter !== undefined) {
    scores.push(Math.min(100, Math.max(0, values.organicMatter)))
  }

  if (scores.length === 0) return 50 // default neutral score

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const userId = auth.payload.userId

    const garden = await prisma.garden.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    })
    if (!garden) return notFound('Plot not found')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit
    const where = { gardenId: params.id }

    const [checks, total] = await Promise.all([
      prisma.soilCheck.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkedAt: 'desc' },
      }),
      prisma.soilCheck.count({ where }),
    ])

    return paginated(checks, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const userId = auth.payload.userId

    // Verify garden ownership
    const garden = await prisma.garden.findFirst({
      where: { id: params.id, userId },
      select: {
        id: true,
        soilQuality: true,
        soilQualityHistory: true,
      },
    })
    if (!garden) return notFound('Plot not found')

    const body = await request.json()
    const { phLevel, moisture, nitrogen, phosphorus, potassium, organicMatter, notes } = body

    // Compute overall quality score
    const quality = computeQualityScore({ phLevel, moisture, nitrogen, phosphorus, potassium, organicMatter })

    // Record the check and update garden in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const soilCheck = await tx.soilCheck.create({
        data: {
          phLevel: phLevel ?? null,
          moisture: moisture ?? null,
          nitrogen: nitrogen ?? null,
          phosphorus: phosphorus ?? null,
          potassium: potassium ?? null,
          organicMatter: organicMatter ?? null,
          quality,
          notes: notes ?? null,
          gardenId: params.id,
          userId,
        },
      })

      // Build soil quality history
      const historyEntry = {
        checkedAt: new Date().toISOString(),
        quality,
        phLevel: phLevel ?? null,
        moisture: moisture ?? null,
        nitrogen: nitrogen ?? null,
        phosphorus: phosphorus ?? null,
        potassium: potassium ?? null,
        organicMatter: organicMatter ?? null,
      }

      const existingHistory = (garden.soilQualityHistory as Array<Record<string, unknown>>) || []
      const updatedHistory = [...existingHistory, historyEntry].slice(-50) // keep last 50 entries

      await tx.garden.update({
        where: { id: params.id },
        data: {
          soilQuality: quality,
          soilLastCheckedAt: new Date(),
          soilQualityHistory: updatedHistory as any,
        },
      })

      return soilCheck
    })

    return success(result, 201)
  } catch (error) {
    return serverError(error)
  }
}
