import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId
    const { searchParams } = new URL(request.url)
    const direction = searchParams.get('direction') || 'all'

    const incomingWhere =
      direction === 'all' || direction === 'incoming'
        ? { toUserId: userId, status: 'PENDING' as const }
        : undefined

    const outgoingWhere =
      direction === 'all' || direction === 'outgoing'
        ? { fromUserId: userId, status: 'PENDING' as const }
        : undefined

    const [incoming, outgoing] = await Promise.all([
      incomingWhere
        ? prisma.friendRequest.findMany({
            where: incomingWhere,
            orderBy: { createdAt: 'desc' },
            include: {
              fromUser: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  level: true,
                },
              },
            },
          })
        : [],
      outgoingWhere
        ? prisma.friendRequest.findMany({
            where: outgoingWhere,
            orderBy: { createdAt: 'desc' },
            include: {
              toUser: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  level: true,
                },
              },
            },
          })
        : [],
    ])

    return success({
      incoming: incoming.map((req) => ({
        id: req.id,
        fromUser: req.fromUser,
        createdAt: req.createdAt,
      })),
      outgoing: outgoing.map((req) => ({
        id: req.id,
        toUser: req.toUser,
        createdAt: req.createdAt,
      })),
    })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const toUserId = (body.toUserId as string | undefined)?.trim()

    if (!toUserId) {
      return badRequest('toUserId is required')
    }

    const fromUserId = auth.payload.userId

    if (toUserId === fromUserId) {
      return badRequest('Cannot send a friend request to yourself')
    }

    // Check target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true },
    })

    if (!targetUser) {
      return notFound('User not found')
    }

    // Check if already friends (either direction)
    const existingFriendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: fromUserId, friendId: toUserId },
          { userId: toUserId, friendId: fromUserId },
        ],
      },
    })

    if (existingFriendship) {
      return badRequest('Already friends with this user')
    }

    // Check for existing request in either direction
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
        status: 'PENDING',
      },
    })

    if (existingRequest) {
      return badRequest('A friend request already exists between you and this user')
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        fromUserId,
        toUserId,
        status: 'PENDING',
      },
      include: {
        toUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    return success(
      {
        message: 'Friend request sent',
        request: {
          id: friendRequest.id,
          toUser: friendRequest.toUser,
          status: friendRequest.status,
          createdAt: friendRequest.createdAt,
        },
      },
      201
    )
  } catch (error) {
    return serverError(error)
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const requestId = (body.requestId as string | undefined)?.trim()
    const action = (body.action as string | undefined)?.trim()

    if (!requestId) {
      return badRequest('requestId is required')
    }

    if (!action || !['accept', 'reject'].includes(action)) {
      return badRequest('action must be "accept" or "reject"')
    }

    const userId = auth.payload.userId

    // Find the request and verify it belongs to the current user
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    })

    if (!friendRequest) {
      return notFound('Friend request not found')
    }

    if (friendRequest.toUserId !== userId) {
      return badRequest('You can only respond to requests sent to you')
    }

    if (friendRequest.status !== 'PENDING') {
      return badRequest(`Request has already been ${friendRequest.status.toLowerCase()}`)
    }

    if (action === 'reject') {
      const updated = await prisma.friendRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          respondedAt: new Date(),
        },
      })

      return success({
        message: 'Friend request rejected',
        request: updated,
      })
    }

    // Accept: create bidirectional Friend records and update request status
    const now = new Date()
    const [updatedRequest] = await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: requestId },
        data: {
          status: 'ACCEPTED',
          respondedAt: now,
        },
      }),
      prisma.friend.create({
        data: {
          userId: friendRequest.toUserId,
          friendId: friendRequest.fromUserId,
        },
      }),
      prisma.friend.create({
        data: {
          userId: friendRequest.fromUserId,
          friendId: friendRequest.toUserId,
        },
      }),
    ])

    return success({
      message: 'Friend request accepted',
      request: updatedRequest,
    })
  } catch (error) {
    return serverError(error)
  }
}
