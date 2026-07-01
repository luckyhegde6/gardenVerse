/**
 * Vercel Cron Job: Growth Tick
 *
 * Advances all virtual garden crops by 1 game tick (50 game-minutes).
 * Called periodically via Vercel Cron (configured in vercel.json).
 *
 * Authentication: CRON_SECRET header must match the environment variable.
 *
 * This replicates the NestJS @Cron(CronExpression.EVERY_4_HOURS) decorator
 * on the GameplayAgent.simulationTick() method.
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { CropStatus } from '@/lib/prisma/generated/client'
import { success, unauthorized, serverError } from '@/lib/middleware/auth'
import { getTask, registerTask, recordTaskRun } from '@/lib/cron'
import logFn from '@/lib/logger'

// Growth constants (matches gardens/[id]/tick route)
const GROWTH_PER_TICK = 1.39
const HYDRATION_DECAY = 2
const NUTRIENT_DECAY = 1
const HEALTH_RECOVERY = 0.5
const STRESS_DAMAGE = 3
const HYDRATION_THRESHOLD = 25
const NUTRIENT_THRESHOLD = 25

export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET — fail closed if not configured
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return serverError('CRON_SECRET environment variable is required')
    }
    const headerSecret = request.headers.get('x-cron-secret') ?? request.headers.get('authorization')?.replace('Bearer ', '')
    if (headerSecret !== cronSecret) {
      return unauthorized('Invalid CRON_SECRET')
    }

    logFn.info('Cron: growth-tick started')

    // Ensure the task is registered (idempotent — registerTask overwrites)
    registerTask({
      id: 'growth-tick',
      name: 'Growth Tick',
      interval: 'every_4_hours',
      description: 'Advances all virtual garden crops by 1 game tick',
      route: '/api/v1/cron/growth-tick',
      enabled: true,
      registeredAt: new Date().toISOString(),
    })

    // Find all active crops in virtual gardens (not harvested/wilted)
    const activeCrops = await prisma.crop.findMany({
      where: {
        status: { notIn: ['HARVESTED', 'WILTED'] },
        garden: { type: 'VIRTUAL' },
      },
      include: {
        garden: { select: { userId: true, type: true } },
      },
    })

    logFn.info(`Cron: growth-tick — found ${activeCrops.length} active crops in virtual gardens`)

    let updatedCount = 0
    let errorCount = 0

    for (const crop of activeCrops) {
      try {
        let {
          growthStage,
          hydration,
          nutrientLevel,
          health,
          stressFactor,
          status,
        } = crop

        // Apply 1 tick (50 game-minutes)
        growthStage = Math.min(100, growthStage + GROWTH_PER_TICK)
        hydration = Math.max(0, hydration - HYDRATION_DECAY)
        nutrientLevel = Math.max(0, nutrientLevel - NUTRIENT_DECAY)

        if (hydration < HYDRATION_THRESHOLD || nutrientLevel < NUTRIENT_THRESHOLD) {
          health = Math.max(0, health - STRESS_DAMAGE)
          stressFactor = Math.min(100, stressFactor + 5)
        } else if (health < 100) {
          health = Math.min(100, health + HEALTH_RECOVERY)
          stressFactor = Math.max(0, stressFactor - 2)
        }

        // Determine status based on growth stage and health
        if (growthStage <= 0) status = CropStatus.SEED
        else if (growthStage <= 25) status = CropStatus.SPROUTING
        else if (growthStage <= 75) status = CropStatus.GROWING
        else if (growthStage >= 100) status = CropStatus.MATURE

        if (health <= 0) status = CropStatus.WILTED

        await prisma.crop.update({
          where: { id: crop.id },
          data: {
            growthStage: Math.round(growthStage * 10) / 10,
            hydration: Math.round(hydration * 10) / 10,
            nutrientLevel: Math.round(nutrientLevel * 10) / 10,
            health: Math.round(health * 10) / 10,
            stressFactor: Math.round(stressFactor * 10) / 10,
            status,
          },
        })

        updatedCount++
      } catch (err) {
        errorCount++
        logFn.error(`Cron: growth-tick — failed to update crop ${crop.id}`, {
          metadata: { error: (err as Error).message },
        })
      }
    }

    // Record the run time in the task registry
    recordTaskRun('growth-tick')

    logFn.info(`Cron: growth-tick complete — ${updatedCount} updated, ${errorCount} errors`)

    return success({
      processed: true,
      task: 'growth-tick',
      cropsUpdated: updatedCount,
      errors: errorCount,
      totalCrops: activeCrops.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logFn.error('Cron: growth-tick failed', {
      metadata: { error: (error as Error).message },
    })
    return serverError(error)
  }
}
