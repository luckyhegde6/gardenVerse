import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

const CARE_STREAK_BONUSES: Record<number, { label: string; healthBonus: number; xpMultiplier?: number; tokens?: number }> = {
  3: { label: '3-day', healthBonus: 5 },
  7: { label: '7-day', healthBonus: 15, xpMultiplier: 1.5 },
  14: { label: '14-day', healthBonus: 30, xpMultiplier: 2.0 },
  30: { label: '30-day', healthBonus: 50, xpMultiplier: 3.0, tokens: 100 },
}

const STREAK_XP_BASE = 10

/**
 * POST /api/v1/gamification/crop/[id]/care
 * Record a care action for a crop, updating its care streak
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const logCtx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(logCtx, request, 401)
    return auth.error
  }

  const userId = auth.payload.userId
  const cropId = params.id

  try {
    // Verify crop exists and belongs to user's garden
    const crop = await prisma.crop.findUnique({
      where: { id: cropId },
      include: { garden: { select: { userId: true } } },
    })

    if (!crop) {
      finishRequestLog(logCtx, request, 404)
      return notFound('Crop not found')
    }

    if (crop.garden.userId !== userId) {
      finishRequestLog(logCtx, request, 403)
      return badRequest('You can only care for crops in your own garden')
    }

    const now = new Date()
    const hoursSinceLastCare = crop.lastWateredAt
      ? (now.getTime() - crop.lastWateredAt.getTime()) / 3600000
      : 999

    const newStreak = hoursSinceLastCare < 30 ? (crop.careStreak || 0) + 1 : 1

    // Update crop care streak
    await prisma.crop.update({
      where: { id: cropId },
      data: {
        careStreak: newStreak,
        totalCareCount: { increment: 1 },
        lastWateredAt: now,
      },
    })

    // Award XP for care action
    const xpAwarded = STREAK_XP_BASE + Math.min(newStreak, 10) * 2
    await awardXP(userId, xpAwarded)

    // Update achievement progress
    await updateAchievementProgress(userId, 'care_taker', 1)

    // Check for streak milestones
    let milestone: string | null = null
    const bonus = Object.entries(CARE_STREAK_BONUSES)
      .filter(([threshold]) => newStreak >= parseInt(threshold))
      .pop()

    if (bonus) {
      const [threshold, bonusData] = bonus
      milestone = `${bonusData.label} streak`
      if (newStreak >= 7) {
        await updateAchievementProgress(userId, 'streak_master', newStreak)
      }
    }

    finishRequestLog(logCtx, request, 200)
    return success({
      streak: newStreak,
      xpAwarded,
      milestone,
      bonus: bonus ? bonus[1] : null,
    })
  } catch (error) {
    logApiError(logCtx, request, error)
    return serverError(error)
  }
}

async function awardXP(userId: string, amount: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { level: true, experience: true, greenCredits: true },
  })
  if (!user) return

  let newXP = user.experience + amount
  let newLevel = user.level
  let tokensAwarded = 0

  while (newXP >= newLevel * 100) {
    newXP -= newLevel * 100
    newLevel++
    tokensAwarded += 100 + newLevel * 10
  }

  const updateData: Record<string, unknown> = { experience: newXP, level: newLevel }
  if (tokensAwarded > 0) {
    updateData.greenCredits = { increment: tokensAwarded }
  }

  await prisma.user.update({ where: { id: userId }, data: updateData })

  if (tokensAwarded > 0) {
    await prisma.tokenTransaction.create({
      data: {
        userId,
        type: 'GREEN_CREDITS',
        amount: tokensAwarded,
        balanceBefore: user.greenCredits,
        balanceAfter: user.greenCredits + tokensAwarded,
        action: 'LEVEL_UP_REWARD',
        description: `Level up reward`,
      },
    })
  }
}

async function updateAchievementProgress(userId: string, key: string, progress: number = 1) {
  const achievement = await prisma.achievement.findUnique({ where: { key } })
  if (!achievement) return

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  })
  if (existing?.completedAt) return

  const newProgress = Math.min(achievement.maxProgress, (existing?.progress || 0) + progress)
  const completed = newProgress >= achievement.maxProgress

  await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
    update: { progress: newProgress, completedAt: completed ? new Date() : undefined },
    create: { userId, achievementId: achievement.id, progress: newProgress, completedAt: completed ? new Date() : undefined },
  })

  if (completed) {
    if (achievement.xpReward > 0) await awardXP(userId, achievement.xpReward)
    if (achievement.tokenReward > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { greenCredits: { increment: achievement.tokenReward } },
      })
    }
  }
}
