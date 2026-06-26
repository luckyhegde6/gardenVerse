import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError } from '@/lib/middleware/auth'

const GARDENER_BADGES = ['🌱', '🌿', '👨‍🌾', '👩‍🌾', '🏡', '🌻']

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId

    const body = await request.json().catch(() => ({}))
    const { gardenPhotoUrl, description, location } = body as {
      gardenPhotoUrl?: string
      description?: string
      location?: string
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isRealGardener: true, gardenerBadge: true },
    })

    if (!existingUser) {
      return badRequest('User not found')
    }

    if (existingUser.isRealGardener) {
      return success({
        message: 'You are already verified as a real gardener!',
        badge: existingUser.gardenerBadge,
        alreadyVerified: true,
      })
    }

    const badge = GARDENER_BADGES[Math.floor(Math.random() * GARDENER_BADGES.length)]

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          isRealGardener: true,
          gardenerBadge: badge,
          gardenerVerifiedAt: new Date(),
        },
      })

      await tx.tokenTransaction.create({
        data: {
          type: 'ECO_POINTS',
          amount: 0,
          balanceBefore: 0,
          balanceAfter: 0,
          action: 'real_gardener_badge',
          description: description || 'Real gardener verification',
          metadata: {
            badge,
            gardenPhotoUrl: gardenPhotoUrl || null,
            location: location || null,
          },
          userId,
        },
      })
    })

    return success(
      {
        message: 'Congratulations! You are now verified as a real gardener.',
        badge,
        verifiedAt: new Date().toISOString(),
      },
      201
    )
  } catch (error) {
    return serverError(error)
  }
}
