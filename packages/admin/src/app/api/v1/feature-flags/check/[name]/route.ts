import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } },
) {
  const ctx = startRequestLog(request)

  try {
    const { name } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const flag = await prisma.featureFlag.findUnique({
      where: { name },
    })

    if (!flag) {
      finishRequestLog(ctx, request, 200)
      return success({ name, enabled: false, rules: null })
    }

    let enabled = flag.enabled

    // Check for user-specific override
    if (userId) {
      const override = await prisma.userFeatureOverride.findUnique({
        where: { userId_featureName: { userId, featureName: name } },
      })

      if (override) {
        finishRequestLog(ctx, request, 200)
        return success({
          name,
          enabled: override.enabled,
          rules: flag.rules,
          overridden: true,
        })
      }
    }

    // Evaluate percentage-based rollout rules
    if (flag.rules && userId) {
      const rules = flag.rules as Record<string, unknown> | null
      if (rules?.percentage && typeof rules.percentage === 'number') {
        const hash = simpleHash(userId)
        const userPercentile = hash % 100
        enabled = userPercentile < rules.percentage ? enabled : false
      }

      if (rules?.userIds && Array.isArray(rules.userIds)) {
        enabled = (rules.userIds as string[]).includes(userId) ? enabled : false
      }
    }

    finishRequestLog(ctx, request, 200)
    return success({
      name,
      enabled,
      rules: flag.rules,
    })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
