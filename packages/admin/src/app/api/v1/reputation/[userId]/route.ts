import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        trustScore: true,
        marketplaceReliability: true,
        communityStanding: true,
        sustainabilityScore: true,
        reputationTokens: true,
        level: true,
        experience: true,
        greenCredits: true,
        ecoPoints: true,
      },
    })

    if (!user) {
      return notFound('User not found')
    }

    const logs = await prisma.reputationLog.findMany({
      where: { userId: params.userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const trustBreakdown = {
      baseScore: 50,
      marketplaceBonus: Math.round((user.marketplaceReliability - 50) * 0.3),
      communityBonus: Math.round((user.communityStanding - 50) * 0.3),
      sustainabilityBonus: Math.round(user.sustainabilityScore * 0.2),
      recentActivity: logs.slice(0, 10).reduce((sum: number, log) => sum + log.scoreChange, 0),
    }

    return success({
      user,
      logs,
      trustBreakdown,
      totalLogEntries: logs.length,
    })
  } catch (error) {
    return serverError(error)
  }
}
