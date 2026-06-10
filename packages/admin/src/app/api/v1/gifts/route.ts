import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError, paginated } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || 'received'

    const where: Record<string, unknown> =
      type === 'sent' ? { fromUserId: userId } : { toUserId: userId }

    const skip = (page - 1) * limit
    const [gifts, total] = await Promise.all([
      prisma.gift.findMany({
        where,
        include: {
          fromUser: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          toUser: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.gift.count({ where }),
    ])

    return paginated(gifts, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { toUserId, itemType, itemName, quantity, message } = body as {
      toUserId?: string
      itemType?: string
      itemName?: string
      quantity?: number
      message?: string
    }

    if (!toUserId) {
      return badRequest('toUserId is required')
    }
    if (!itemType) {
      return badRequest('itemType is required')
    }
    if (!itemName) {
      return badRequest('itemName is required')
    }

    // Prevent sending gift to self
    if (toUserId === auth.payload.userId) {
      return badRequest('Cannot send a gift to yourself')
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true },
    })
    if (!recipient) {
      return notFound('Recipient not found')
    }

    // Verify friendship exists (bidirectional)
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: auth.payload.userId, friendId: toUserId },
          { userId: toUserId, friendId: auth.payload.userId },
        ],
      },
    })
    if (!friendship) {
      return badRequest('You must be friends with the recipient to send a gift')
    }

    const gift = await prisma.gift.create({
      data: {
        fromUserId: auth.payload.userId,
        toUserId,
        itemType,
        itemName,
        quantity: quantity ?? 1,
        message: message ?? null,
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

    return success(gift, 201)
  } catch (error) {
    return serverError(error)
  }
}
