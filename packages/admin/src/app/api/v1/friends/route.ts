import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [friends, total] = await Promise.all([
      prisma.friend.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          friend: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              level: true,
              lastActiveAt: true,
            },
          },
        },
      }),
      prisma.friend.count({ where: { userId } }),
    ])

    const data = friends.map((f) => ({
      id: f.id,
      friendId: f.friend.id,
      username: f.friend.username,
      displayName: f.friend.displayName,
      avatarUrl: f.friend.avatarUrl,
      level: f.friend.level,
      isOnline: f.friend.lastActiveAt
        ? Date.now() - new Date(f.friend.lastActiveAt).getTime() < 5 * 60 * 1000
        : false,
      friendsSince: f.createdAt,
    }))

    return success({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
    const identifier = (body.identifier as string | undefined)?.trim()

    if (!identifier) {
      return badRequest('identifier is required')
    }

    const currentUserId = auth.payload.userId

    // Find target user by username or email
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      select: { id: true, username: true },
    })

    if (!targetUser) {
      return notFound('User not found')
    }

    if (targetUser.id === currentUserId) {
      return badRequest('Cannot add yourself as a friend')
    }

    // Check if already friends (either direction)
    const existingFriendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: currentUserId, friendId: targetUser.id },
          { userId: targetUser.id, friendId: currentUserId },
        ],
      },
    })

    if (existingFriendship) {
      return badRequest('Already friends with this user')
    }

    // Check if there is a pending friend request between these users
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { fromUserId: currentUserId, toUserId: targetUser.id },
          { fromUserId: targetUser.id, toUserId: currentUserId },
        ],
        status: 'PENDING',
      },
    })

    if (existingRequest) {
      return badRequest('A friend request already exists between you and this user')
    }

    // Create bidirectional Friend records in a transaction
    const [friendA, friendB] = await prisma.$transaction([
      prisma.friend.create({
        data: {
          userId: currentUserId,
          friendId: targetUser.id,
        },
      }),
      prisma.friend.create({
        data: {
          userId: targetUser.id,
          friendId: currentUserId,
        },
      }),
    ])

    return success(
      {
        message: 'Friend added successfully',
        friend: {
          id: friendB.id,
          friendId: targetUser.id,
          username: targetUser.username,
        },
      },
      201
    )
  } catch (error) {
    return serverError(error)
  }
}
