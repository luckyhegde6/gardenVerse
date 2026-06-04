import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

const XP_REWARDS = {
  CREATE_HYBRID: 100,
  DISCOVER_SPECIES: 50,
  PERFECT_SPECIES: 200,
}

const MASTERY_XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000]

/**
 * POST /api/v1/gamification/hybrid
 * Create a plant hybrid from two parent species
 * Requires both species in collection at mastery level >= 3
 */
export async function POST(request: NextRequest) {
  const logCtx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(logCtx, request, 401)
    return auth.error
  }

  const userId = auth.payload.userId

  try {
    const body = await request.json()
    const { parent1Id, parent2Id } = body

    if (!parent1Id || !parent2Id) {
      finishRequestLog(logCtx, request, 400)
      return badRequest('parent1Id and parent2Id are required')
    }

    if (parent1Id === parent2Id) {
      finishRequestLog(logCtx, request, 400)
      return badRequest('Cannot create a hybrid from the same species')
    }

    // Verify both parent species exist
    const [parent1, parent2] = await Promise.all([
      prisma.plantSpecies.findUnique({ where: { id: parent1Id } }),
      prisma.plantSpecies.findUnique({ where: { id: parent2Id } }),
    ])

    if (!parent1 || !parent2) {
      finishRequestLog(logCtx, request, 404)
      return notFound('One or both parent species not found')
    }

    // Verify user has both species in collection
    const [collection1, collection2] = await Promise.all([
      prisma.plantCollection.findUnique({
        where: { userId_speciesId: { userId, speciesId: parent1Id } },
      }),
      prisma.plantCollection.findUnique({
        where: { userId_speciesId: { userId, speciesId: parent2Id } },
      }),
    ])

    if (!collection1) {
      finishRequestLog(logCtx, request, 400)
      return badRequest(`You must discover "${parent1.commonName}" before creating hybrids`)
    }
    if (!collection2) {
      finishRequestLog(logCtx, request, 400)
      return badRequest(`You must discover "${parent2.commonName}" before creating hybrids`)
    }

    // Verify mastery levels >= 3
    const [mastery1, mastery2] = await Promise.all([
      prisma.speciesMastery.findUnique({
        where: { userId_speciesId: { userId, speciesId: parent1Id } },
      }),
      prisma.speciesMastery.findUnique({
        where: { userId_speciesId: { userId, speciesId: parent2Id } },
      }),
    ])

    const level1 = mastery1?.level ?? 1
    const level2 = mastery2?.level ?? 1

    if (level1 < 3) {
      finishRequestLog(logCtx, request, 400)
      return badRequest(`Mastery level 3+ required for "${parent1.commonName}" (current: ${level1})`)
    }
    if (level2 < 3) {
      finishRequestLog(logCtx, request, 400)
      return badRequest(`Mastery level 3+ required for "${parent2.commonName}" (current: ${level2})`)
    }

    // Check if hybrid already exists
    const existing = await prisma.plantHybrid.findUnique({
      where: { parent1Id_parent2Id: { parent1Id, parent2Id } },
    })
    if (existing) {
      finishRequestLog(logCtx, request, 200)
      return success({
        created: false,
        message: 'Hybrid already exists',
        hybrid: existing,
      })
    }

    // Create the hybrid result species
    const hybridName = `${parent1.commonName}-${parent2.commonName} Hybrid`
    const hybridScientificName = `x ${parent1.scientificName} × ${parent2.scientificName}`

    const resultSpecies = await prisma.plantSpecies.create({
      data: {
        commonName: hybridName,
        scientificName: hybridScientificName,
        family: parent1.family ?? parent2.family,
        difficulty: 'HARD',
        isHybrid: true,
        hybridRecipe: { parent1: parent1Id, parent2: parent2Id },
        tags: ['hybrid', ...(parent1.tags || []), ...(parent2.tags || [])],
        companionSpeciesIds: [
          ...(parent1.companionSpeciesIds || []),
          ...(parent2.companionSpeciesIds || []),
        ],
        baseYield: Math.round(((parent1.baseYield ?? 1) + (parent2.baseYield ?? 1)) / 2) + 1,
        tokensPerHarvest: Math.round(((parent1.tokensPerHarvest ?? 10) + (parent2.tokensPerHarvest ?? 10)) * 1.5),
      },
    })

    // Create the hybrid record
    const hybrid = await prisma.plantHybrid.create({
      data: {
        parent1Id,
        parent2Id,
        resultSpeciesId: resultSpecies.id,
        discoveredById: userId,
      },
    })

    // Auto-discover the result species
    await prisma.plantCollection.create({
      data: { userId, speciesId: resultSpecies.id },
    })

    // Award XP
    await awardXP(userId, XP_REWARDS.CREATE_HYBRID)

    // Update achievement progress
    await updateAchievementProgress(userId, 'hybrid_pioneer', 1)

    finishRequestLog(logCtx, request, 201)
    return success({
      created: true,
      hybrid,
      resultSpecies,
      xpAwarded: XP_REWARDS.CREATE_HYBRID,
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
