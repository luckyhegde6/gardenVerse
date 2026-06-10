import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, requireAuth, success, badRequest, serverError, notFound } from '@/lib/middleware/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(request.url)
  const { id } = params

  // Try to authenticate for user progress, but don't fail if no token
  let userId: string | null = null
  const auth = requireAuth(request)
  if ('payload' in auth) {
    userId = auth.payload.userId
  }

  try {
    const event = await prisma.seasonEvent.findUnique({
      where: { id },
      include: {
        shopItems: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { userProgress: true, quests: true },
        },
      },
    })

    if (!event) {
      return notFound('Event not found')
    }

    // Fetch user's progress for this event
    let userProgress = null
    if (userId) {
      userProgress = await prisma.userEventProgress.findUnique({
        where: {
          userId_seasonEventId: {
            userId,
            seasonEventId: id,
          },
        },
      })
    }

    return success({
      id: event.id,
      key: event.key,
      name: event.name,
      description: event.description,
      type: event.type,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      icon: event.icon,
      bannerUrl: event.bannerUrl,
      themeColor: event.themeColor,
      shopItems: event.shopItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        currency: item.currency,
        icon: item.icon,
        stock: item.stock,
        isLimited: item.isLimited,
        createdAt: item.createdAt,
      })),
      participantCount: event._count.userProgress,
      questCount: event._count.quests,
      userProgress: userProgress
        ? {
            points: userProgress.points,
            tier: userProgress.tier,
            rewardsClaimed: userProgress.rewardsClaimed,
            createdAt: userProgress.createdAt,
            updatedAt: userProgress.updatedAt,
          }
        : null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    })
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  const { id } = params

  try {
    const existing = await prisma.seasonEvent.findUnique({ where: { id } })
    if (!existing) {
      return notFound('Event not found')
    }

    await prisma.seasonEvent.delete({ where: { id } })

    return success({ message: `Event '${existing.name}' deleted` })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const { id: eventId } = params

  if (action === 'progress') {
    return addProgress(request, eventId)
  }

  return badRequest('Invalid action')
}

async function addProgress(request: NextRequest, eventId: string) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  const userId = auth.payload.userId

  try {
    const body = await request.json()
    const pointsToAdd = body.points ? Number(body.points) : 0

    if (pointsToAdd <= 0) {
      return badRequest('points must be a positive number')
    }

    // Verify event exists
    const event = await prisma.seasonEvent.findUnique({ where: { id: eventId } })
    if (!event) {
      return notFound('Event not found')
    }

    // Upsert user event progress
    const existing = await prisma.userEventProgress.findUnique({
      where: {
        userId_seasonEventId: {
          userId,
          seasonEventId: eventId,
        },
      },
    })

    const newPoints = (existing?.points || 0) + pointsToAdd
    // Tier increases every 500 points
    const newTier = Math.min(Math.floor(newPoints / 500) + 1, 10)

    const progress = await prisma.userEventProgress.upsert({
      where: {
        userId_seasonEventId: {
          userId,
          seasonEventId: eventId,
        },
      },
      update: {
        points: newPoints,
        tier: newTier,
      },
      create: {
        userId,
        seasonEventId: eventId,
        points: newPoints,
        tier: newTier,
      },
    })

    return success({
      points: progress.points,
      tier: progress.tier,
      pointsAdded: pointsToAdd,
      rewardsClaimed: progress.rewardsClaimed,
      updatedAt: progress.updatedAt,
    })
  } catch (error) {
    return serverError(error)
  }
}
