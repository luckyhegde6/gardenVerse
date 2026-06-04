import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

const XP_REWARDS = {
  DISCOVER_SPECIES: 50,
}

/**
 * POST /api/v1/gamification/species/[id]/discover
 * Discover a plant species and add it to the user's collection
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
  const speciesId = params.id

  try {
    // Verify species exists
    const species = await prisma.plantSpecies.findUnique({
      where: { id: speciesId },
    })
    if (!species) {
      finishRequestLog(logCtx, request, 404)
      return notFound('Plant species not found')
    }

    // Check if already discovered
    const existing = await prisma.plantCollection.findUnique({
      where: {
        userId_speciesId: { userId, speciesId },
      },
    })
    if (existing) {
      finishRequestLog(logCtx, request, 200)
      return success({
        discovered: false,
        message: 'Species already discovered',
        collection: existing,
        totalDiscovered: await prisma.plantCollection.count({ where: { userId } }),
      })
    }

    // Create the collection entry
    const collection = await prisma.plantCollection.create({
      data: { userId, speciesId },
    })

    // Award XP for discovery
    await awardXP(userId, XP_REWARDS.DISCOVER_SPECIES)

    // Update achievement progress
    await updateAchievementProgress(userId, 'species_collector', 1)

    const totalDiscovered = await prisma.plantCollection.count({ where: { userId } })

    finishRequestLog(logCtx, request, 201)
    return success({
      discovered: true,
      collection,
      totalDiscovered,
      xpAwarded: XP_REWARDS.DISCOVER_SPECIES,
    }, 201)
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
  let leveledUp = false

  while (newXP >= newLevel * 100) {
    newXP -= newLevel * 100
    newLevel++
    leveledUp = true
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
        description: `Level up to ${newLevel} reward`,
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
