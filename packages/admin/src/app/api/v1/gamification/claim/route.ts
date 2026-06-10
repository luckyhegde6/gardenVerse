import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError } from '@/lib/middleware/auth'

/**
 * 7-day reward cycle:
 *   Day 1: 10 GC
 *   Day 2: 20 GC
 *   Day 3: 30 GC
 *   Day 4: 50 EC
 *   Day 5: 50 GC
 *   Day 6: 75 GC
 *   Day 7: 100 XP
 */
const REWARD_SCHEDULE: Record<number, { amount: number; type: 'GREEN_CREDITS' | 'ECO_POINTS' | 'EXPERIENCE' }> = {
  1: { amount: 10, type: 'GREEN_CREDITS' },
  2: { amount: 20, type: 'GREEN_CREDITS' },
  3: { amount: 30, type: 'GREEN_CREDITS' },
  4: { amount: 50, type: 'ECO_POINTS' },
  5: { amount: 50, type: 'GREEN_CREDITS' },
  6: { amount: 75, type: 'GREEN_CREDITS' },
  7: { amount: 100, type: 'EXPERIENCE' },
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Returns the number of whole days from `a` to `b` (b - a). */
function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 86_400_000
  return Math.floor((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY)
}

/**
 * Count consecutive days claimed from `allRewards` (newest-first).
 * Two records are consecutive if they are exactly 1 calendar day apart.
 */
function countStreak(allRewards: { claimedAt: Date }[]): number {
  let streak = 0
  let expectedDate: Date | null = null

  for (const reward of allRewards) {
    const rewardDate = startOfDay(reward.claimedAt)

    if (expectedDate === null) {
      // First record in the loop — this is the most recent claim
      streak = 1
      expectedDate = new Date(rewardDate.getTime() - 86_400_000)
    } else {
      const gap = daysBetween(rewardDate, expectedDate)
      if (gap === 0) {
        // Duplicate claim on the same day (shouldn't happen with unique constraint)
        continue
      }
      if (gap === 1) {
        streak++
        expectedDate = new Date(rewardDate.getTime() - 86_400_000)
      } else {
        break
      }
    }
  }

  return streak
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId
    const now = new Date()
    const today = startOfDay(now)

    // Fetch user profile and all existing daily reward records in parallel
    const [user, rewards] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, greenCredits: true, ecoPoints: true, experience: true },
      }),
      prisma.dailyReward.findMany({
        where: { userId },
        orderBy: { claimedAt: 'desc' },
      }),
    ])

    if (!user) {
      return badRequest('User not found')
    }

    // ── Determine the reward day for this claim ──────────────────────────
    let currentDay: number
    let alreadyClaimedToday = false

    if (rewards.length === 0) {
      // First claim ever
      currentDay = 1
    } else {
      const latest = rewards[0]
      const latestDate = startOfDay(latest.claimedAt)
      const daysSinceLatest = daysBetween(latestDate, today)

      if (daysSinceLatest === 0) {
        // Already claimed today
        alreadyClaimedToday = true
        currentDay = latest.day
      } else if (daysSinceLatest === 1) {
        // Consecutive day — continue the cycle or wrap after day 7
        currentDay = latest.day >= 7 ? 1 : latest.day + 1
      } else {
        // Streak broken (2+ calendar days gap) — restart at day 1
        currentDay = 1
      }
    }

    if (alreadyClaimedToday) {
      return badRequest('Daily reward already claimed today')
    }

    const reward = REWARD_SCHEDULE[currentDay]
    if (!reward) {
      return badRequest('Invalid reward day')
    }

    // ── Award the reward inside a transaction ────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      // Update user balance / XP depending on reward type
      if (reward.type === 'GREEN_CREDITS') {
        const balanceBefore = user.greenCredits
        const balanceAfter = balanceBefore + reward.amount

        await tx.user.update({
          where: { id: userId },
          data: {
            greenCredits: { increment: reward.amount },
            lastActiveAt: now,
          },
        })

        await tx.tokenTransaction.create({
          data: {
            userId,
            type: 'GREEN_CREDITS',
            amount: reward.amount,
            balanceBefore,
            balanceAfter,
            action: 'DAILY_REWARD',
            referenceType: 'daily_reward',
            description: `Day ${currentDay} daily reward: ${reward.amount} Green Credits`,
            metadata: { streakDay: currentDay, cycleDay: currentDay },
          },
        })
      } else if (reward.type === 'ECO_POINTS') {
        const balanceBefore = user.ecoPoints
        const balanceAfter = balanceBefore + reward.amount

        await tx.user.update({
          where: { id: userId },
          data: {
            ecoPoints: { increment: reward.amount },
            lastActiveAt: now,
          },
        })

        await tx.tokenTransaction.create({
          data: {
            userId,
            type: 'ECO_POINTS',
            amount: reward.amount,
            balanceBefore,
            balanceAfter,
            action: 'DAILY_REWARD',
            referenceType: 'daily_reward',
            description: `Day ${currentDay} daily reward: ${reward.amount} Eco Points`,
            metadata: { streakDay: currentDay, cycleDay: currentDay },
          },
        })
      } else {
        // EXPERIENCE — no TokenTransaction needed, just increment XP
        await tx.user.update({
          where: { id: userId },
          data: {
            experience: { increment: reward.amount },
            lastActiveAt: now,
          },
        })
      }

      // Record the claim
      await tx.dailyReward.create({
        data: {
          userId,
          day: currentDay,
          claimedAt: now,
        },
      })

      // Count active streak shields
      const shieldCount = await tx.streakShield.count({
        where: { userId, isActive: true },
      })

      return { shieldCount }
    })

    // ── Compute the current streak from DailyReward records ──────────────
    const updatedRewards = await prisma.dailyReward.findMany({
      where: { userId },
      orderBy: { claimedAt: 'desc' },
    })
    const streak = countStreak(updatedRewards)

    // ── Compute longest streak ───────────────────────────────────────────
    // Walk through all rewards oldest-first to find the longest run
    const sortedAsc = [...updatedRewards].reverse()
    let longestStreak = 0
    let run = 0
    let prevDate: Date | null = null
    for (const r of sortedAsc) {
      const d = startOfDay(r.claimedAt)
      if (prevDate === null) {
        run = 1
      } else {
        const gap = daysBetween(prevDate, d)
        if (gap === 1) {
          run++
        } else {
          run = 1
        }
      }
      if (run > longestStreak) longestStreak = run
      prevDate = d
    }

    return success({
      streak,
      longestStreak,
      currentDay,
      rewardAmount: reward.amount,
      rewardType: reward.type,
      shieldCount: result.shieldCount,
      claimedToday: true,
    })
  } catch (error) {
    return serverError(error)
  }
}
