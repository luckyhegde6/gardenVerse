import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError, notFound } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const claim = searchParams.get('claim')
  const userId = auth.payload.userId

  // Claim mode: claim a specific quest reward
  if (claim === 'true') {
    return claimQuestReward(request, userId)
  }

  // Default: return user's quest progress grouped by category
  try {
    const userQuests = await prisma.userQuest.findMany({
      where: { userId },
      include: {
        quest: {
          include: { season: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const grouped: Record<string, typeof userQuests> = {
      DAILY: [],
      WEEKLY: [],
      SEASONAL: [],
    }

    for (const uq of userQuests) {
      const category = uq.quest.category
      if (grouped[category]) {
        grouped[category].push(uq)
      } else {
        grouped.DAILY.push(uq)
      }
    }

    return success({
      grouped,
      summary: {
        total: userQuests.length,
        completed: userQuests.filter(uq => uq.isCompleted).length,
        claimed: userQuests.filter(uq => uq.claimedAt !== null).length,
        pendingClaim: userQuests.filter(uq => uq.isCompleted && uq.claimedAt === null).length,
      },
    })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  return claimQuestReward(request, auth.payload.userId)
}

async function claimQuestReward(request: NextRequest, userId: string) {
  try {
    const body = await request.json()
    const { questId } = body

    if (!questId) {
      return badRequest('questId is required')
    }

    const userQuest = await prisma.userQuest.findUnique({
      where: {
        userId_questId: {
          userId,
          questId: String(questId),
        },
      },
      include: { quest: true },
    })

    if (!userQuest) {
      return notFound('Quest progress not found for this user')
    }

    if (!userQuest.isCompleted) {
      return badRequest('Quest is not yet completed')
    }

    if (userQuest.claimedAt) {
      return badRequest('Quest reward has already been claimed')
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUserQuest = await tx.userQuest.update({
        where: { id: userQuest.id },
        data: { claimedAt: new Date() },
      })

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { experience: true, greenCredits: true },
      })

      if (!user) {
        throw new Error('User not found during claim')
      }

      const newExperience = user.experience + userQuest.quest.xpReward
      const newCredits = user.greenCredits + userQuest.quest.creditReward

      await tx.user.update({
        where: { id: userId },
        data: {
          experience: newExperience,
          greenCredits: newCredits,
        },
      })

      return {
        userQuest: updatedUserQuest,
        xpAwarded: userQuest.quest.xpReward,
        creditsAwarded: userQuest.quest.creditReward,
        newExperience,
        newCredits,
      }
    })

    return success(result)
  } catch (error) {
    return serverError(error)
  }
}
