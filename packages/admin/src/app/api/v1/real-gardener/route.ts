import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId

    const [user, gardenCount, soilCheckCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          isRealGardener: true,
          gardenerBadge: true,
          gardenerVerifiedAt: true,
        },
      }),
      prisma.garden.count({ where: { userId } }),
      prisma.soilCheck.count({ where: { userId } }),
    ])

    if (!user) {
      return success({
        isRealGardener: false,
        gardenCount,
        soilCheckCount,
      })
    }

    let encouragement: string | null = null
    if (user.isRealGardener) {
      encouragement = getEncouragementMessage(user.gardenerBadge)
    }

    return success({
      isRealGardener: user.isRealGardener,
      badge: user.gardenerBadge,
      verifiedAt: user.gardenerVerifiedAt?.toISOString() ?? null,
      gardenCount,
      soilCheckCount,
      encouragement,
    })
  } catch (error) {
    return serverError(error)
  }
}

function getEncouragementMessage(badge: string | null): string {
  const badgeMsg = badge || '🌱'
  const messages = [
    `You're a true gardener! ${badgeMsg} Keep nurturing your green space.`,
    `Real gardeners grow more than plants — they grow communities. ${badgeMsg}`,
    `Your garden is a reflection of your dedication. ${badgeMsg} Keep up the great work!`,
    `Every seed you plant is a step toward a greener future. ${badgeMsg}`,
    `The earth laughs in flowers — and your garden is proof! ${badgeMsg}`,
  ]
  const dayOfYear = getDayOfYear()
  return messages[dayOfYear % messages.length]
}

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
