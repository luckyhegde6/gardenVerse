import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { CropStatus } from '@/lib/prisma/generated/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

const GROWTH_PER_TICK = 1.39
const HYDRATION_DECAY = 2
const NUTRIENT_DECAY = 1
const HEALTH_RECOVERY = 0.5
const STRESS_DAMAGE = 3
const HYDRATION_THRESHOLD = 25
const NUTRIENT_THRESHOLD = 25

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const garden = await prisma.garden.findUnique({ where: { id: params.id } })
    if (!garden) return notFound('Garden not found')

    const body = await request.json().catch(() => ({}))
    const gameMinutes: number = body.gameMinutes ?? 50
    const ticks = Math.max(1, Math.round(gameMinutes / 50))

    const crops = await prisma.crop.findMany({
      where: { gardenId: params.id, status: { notIn: ['HARVESTED', 'WILTED'] } },
    })

    const updatedCrops = await Promise.all(
      crops.map(crop => {
        let { growthStage, hydration, nutrientLevel, health, stressFactor, status } = crop
        let changed = false

        for (let t = 0; t < ticks; t++) {
          if (status === 'HARVESTED' || status === 'WILTED') break

          growthStage = Math.min(100, growthStage + GROWTH_PER_TICK)
          hydration = Math.max(0, hydration - HYDRATION_DECAY)
          nutrientLevel = Math.max(0, nutrientLevel - NUTRIENT_DECAY)

          if (hydration < HYDRATION_THRESHOLD || nutrientLevel < NUTRIENT_THRESHOLD) {
            health = Math.max(0, health - STRESS_DAMAGE)
            stressFactor = Math.min(100, stressFactor + 5)
          } else if (health < 100) {
            health = Math.min(100, health + HEALTH_RECOVERY)
            stressFactor = Math.max(0, stressFactor - 2)
          }

          if (growthStage <= 0) status = CropStatus.SEED
          else if (growthStage <= 25) status = CropStatus.SPROUTING
          else if (growthStage <= 75) status = CropStatus.GROWING
          else if (growthStage >= 100) status = CropStatus.MATURE

          if (health <= 0) status = CropStatus.WILTED

          changed = true
        }

        if (!changed) return null

        return prisma.crop.update({
          where: { id: crop.id },
          data: {
            growthStage: Math.round(growthStage),
            hydration: Math.round(hydration * 10) / 10,
            nutrientLevel: Math.round(nutrientLevel * 10) / 10,
            health: Math.round(health * 10) / 10,
            stressFactor: Math.round(stressFactor * 10) / 10,
            status,
          },
        })
      }),
    )

    const successful = updatedCrops.filter(Boolean)

    return success({
      ticksApplied: ticks,
      cropsUpdated: successful.length,
      crops: successful,
    })
  } catch (error) {
    return serverError(error)
  }
}
