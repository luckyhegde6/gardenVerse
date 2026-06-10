import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { friendId: string } }
) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId
    const { friendId } = params

    // Verify the friendship exists
    const friendship = await prisma.friend.findFirst({
      where: {
        userId,
        friendId,
      },
    })

    if (!friendship) {
      return notFound('Friend not found')
    }

    // Get friend profile with garden info and achievements count
    const friendProfile = await prisma.user.findUnique({
      where: { id: friendId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        level: true,
        experience: true,
        greenCredits: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveAt: true,
        region: true,
        garden: {
          select: {
            id: true,
            name: true,
            type: true,
            size: true,
            gridWidth: true,
            gridHeight: true,
            soilQuality: true,
            irrigationLevel: true,
            sunlightExposure: true,
            theme: true,
            decorations: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { crops: true },
            },
          },
        },
        _count: {
          select: {
            userAchievements: true,
          },
        },
      },
    })

    if (!friendProfile) {
      return notFound('Friend not found')
    }

    return success({
      friend: {
        id: friendProfile.id,
        username: friendProfile.username,
        displayName: friendProfile.displayName,
        avatarUrl: friendProfile.avatarUrl,
        bio: friendProfile.bio,
        level: friendProfile.level,
        experience: friendProfile.experience,
        greenCredits: friendProfile.greenCredits,
        currentStreak: friendProfile.currentStreak,
        longestStreak: friendProfile.longestStreak,
        isOnline: friendProfile.lastActiveAt
          ? Date.now() - new Date(friendProfile.lastActiveAt).getTime() < 5 * 60 * 1000
          : false,
        region: friendProfile.region,
        achievementsCount: friendProfile._count.userAchievements,
        garden: friendProfile.garden,
      },
    })
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { friendId: string } }
) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId
    const { friendId } = params

    // Verify the friendship exists
    const friendship = await prisma.friend.findFirst({
      where: {
        userId,
        friendId,
      },
    })

    if (!friendship) {
      return notFound('Friend not found')
    }

    // Delete both directional Friend records in a transaction
    await prisma.$transaction([
      prisma.friend.deleteMany({
        where: {
          userId,
          friendId,
        },
      }),
      prisma.friend.deleteMany({
        where: {
          userId: friendId,
          friendId: userId,
        },
      }),
    ])

    return success({
      message: 'Friend removed successfully',
    })
  } catch (error) {
    return serverError(error)
  }
}
