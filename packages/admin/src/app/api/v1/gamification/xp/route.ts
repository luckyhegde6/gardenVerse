import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

/**
 * POST /api/v1/gamification/xp
 * Award XP to a user (admin only). Triggers level-up check.
 */
export async function POST(request: NextRequest) {
  const logCtx = startRequestLog(request)
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) {
    finishRequestLog(logCtx, request, 403)
    return auth.error
  }

  try {
    const body = await request.json()
    const { userId, amount, reason } = body

    if (!userId) {
      finishRequestLog(logCtx, request, 400)
      return badRequest('userId is required')
    }

    if (!amount || typeof amount !== 'number' || amount < 1) {
      finishRequestLog(logCtx, request, 400)
      return badRequest('amount must be a positive integer')
    }

    // Verify target user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, level: true, experience: true, greenCredits: true },
    })
    if (!user) {
      finishRequestLog(logCtx, request, 404)
      return notFound('User not found')
    }

    // Calculate level-up
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

    // Update user
    const updateData: Record<string, unknown> = {
      experience: newXP,
      level: newLevel,
    }
    if (tokensAwarded > 0) {
      updateData.greenCredits = { increment: tokensAwarded }
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    // Record token transaction for level-up rewards
    if (tokensAwarded > 0) {
      await prisma.tokenTransaction.create({
        data: {
          userId,
          type: 'GREEN_CREDITS',
          amount: tokensAwarded,
          balanceBefore: user.greenCredits,
          balanceAfter: user.greenCredits + tokensAwarded,
          action: 'LEVEL_UP_REWARD',
          description: `Level up to ${newLevel} reward${reason ? ` (${reason})` : ''}`,
        },
      })
    }

    // Record audit log for admin action
    await prisma.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'AWARD_XP',
        entity: 'user',
        entityId: userId,
        changes: {
          amount,
          reason: reason || 'manual_admin',
          newLevel,
          tokensAwarded,
        },
      },
    })

    finishRequestLog(logCtx, request, 200)
    return success({
      xpAwarded: amount,
      newTotal: newXP,
      leveledUp,
      newLevel,
      tokensAwarded,
    })
  } catch (error) {
    logApiError(logCtx, request, error)
    return serverError(error)
  }
}
