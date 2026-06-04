import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: { category: 'asc' },
    })

    const userProgress = await prisma.userAchievement.findMany({
      where: { userId: auth.payload.userId },
    })

    const progressMap = new Map(userProgress.map(up => [up.achievementId, up]))

    return success(achievements.map(a => ({
      id: a.id,
      key: a.key,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      maxProgress: a.maxProgress,
      xpReward: a.xpReward,
      tokenReward: a.tokenReward,
      progress: progressMap.get(a.id)?.progress ?? 0,
      completed: progressMap.get(a.id)?.completedAt !== null,
      completedAt: progressMap.get(a.id)?.completedAt ?? null,
    })))
  } catch (error) {
    return serverError(error)
  }
}
