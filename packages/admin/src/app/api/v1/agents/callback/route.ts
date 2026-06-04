import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

interface AgentEvent {
  eventType: string
  payload: Record<string, unknown>
}

async function handleGameplayCropPlanted(payload: Record<string, unknown>) {
  const userId = payload.userId as string
  const speciesId = payload.speciesId as string
  const cropId = payload.cropId as string
  if (!userId || !cropId) return

  await prisma.user.update({ where: { id: userId }, data: { experience: { increment: 15 } } })

  if (speciesId) {
    const existing = await prisma.plantCollection.findUnique({
      where: { userId_speciesId: { userId, speciesId } },
    })
    if (!existing) {
      await prisma.plantCollection.create({ data: { userId, speciesId } })
    }
  }
}

async function handleGameplayCropWatered(payload: Record<string, unknown>) {
  const userId = payload.userId as string
  const cropId = payload.cropId as string
  if (!userId || !cropId) return

  await prisma.user.update({ where: { id: userId }, data: { experience: { increment: 5 } } })

  const crop = await prisma.crop.findUnique({ where: { id: cropId } })
  if (crop) {
    const now = new Date()
    const lastCare = crop.lastWateredAt
    const hoursSinceCare = lastCare ? (now.getTime() - lastCare.getTime()) / 3600000 : 999
    const newStreak = hoursSinceCare < 30 ? (crop.careStreak || 0) + 1 : 1
    await prisma.crop.update({
      where: { id: cropId },
      data: { careStreak: newStreak },
    })
  }
}

async function handleGameplayCropFertilized(payload: Record<string, unknown>) {
  const userId = payload.userId as string
  const cropId = payload.cropId as string
  if (!userId || !cropId) return

  await prisma.user.update({ where: { id: userId }, data: { experience: { increment: 10 } } })

  const crop = await prisma.crop.findUnique({ where: { id: cropId } })
  if (crop) {
    const now = new Date()
    const lastCare = crop.lastFertilizedAt
    const hoursSinceCare = lastCare ? (now.getTime() - lastCare.getTime()) / 3600000 : 999
    const newStreak = hoursSinceCare < 30 ? (crop.careStreak || 0) + 1 : 1
    await prisma.crop.update({
      where: { id: cropId },
      data: { careStreak: newStreak },
    })
  }
}

async function handleGameplayCropHarvested(payload: Record<string, unknown>) {
  const userId = payload.userId as string
  const healthScore = (payload.healthScore as number) || 50
  if (!userId) return

  const xpBonus = Math.round(healthScore * 0.5)
  await prisma.user.update({ where: { id: userId }, data: { experience: { increment: 20 + xpBonus } } })

  const cropId = payload.cropId as string
  if (cropId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { experience: true, level: true } })
    if (user) {
      const newLevel = Math.floor(user.experience / 100) + 1
      if (newLevel > user.level) {
        await prisma.user.update({ where: { id: userId }, data: { level: newLevel } })
      }
    }
  }
}

const EVENT_HANDLERS: Record<string, (payload: Record<string, unknown>) => Promise<void>> = {
  'garden.crop.planted': handleGameplayCropPlanted,
  'garden.crop.watered': handleGameplayCropWatered,
  'garden.crop.fertilized': handleGameplayCropFertilized,
  'garden.crop.harvested': handleGameplayCropHarvested,
}

export async function POST(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const body: AgentEvent = await request.json()
    const { eventType, payload } = body

    if (!eventType || !payload) {
      finishRequestLog(ctx, request, 400)
      return badRequest('eventType and payload are required')
    }

    const handler = EVENT_HANDLERS[eventType]
    if (handler) {
      await handler(payload)
    }

    finishRequestLog(ctx, request, 200)
    return success({ processed: true, eventType, handlerFound: !!handler })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
