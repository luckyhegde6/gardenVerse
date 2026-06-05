import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError, forbidden } from '@/lib/middleware/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { id } = await params

    const gift = await prisma.gift.findUnique({
      where: { id },
      include: {
        fromUser: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        toUser: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    })

    if (!gift) {
      return notFound('Gift not found')
    }

    return success(gift)
  } catch (error) {
    return serverError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { id } = await params

    const gift = await prisma.gift.findUnique({
      where: { id },
    })

    if (!gift) {
      return notFound('Gift not found')
    }

    // Only the recipient can open the gift
    if (gift.toUserId !== auth.payload.userId) {
      return forbidden('Only the recipient can open this gift')
    }

    // Already opened
    if (gift.isOpened) {
      return badRequest('Gift has already been opened')
    }

    const openedGift = await prisma.gift.update({
      where: { id },
      data: {
        isOpened: true,
        openedAt: new Date(),
      },
      include: {
        fromUser: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        toUser: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    })

    return success(openedGift)
  } catch (error) {
    return serverError(error)
  }
}
