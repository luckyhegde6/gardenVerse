import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    const where: Record<string, unknown> = {}
    if (campaignId) {
      where.campaignId = campaignId
    }

    const rewards = await prisma.campaignReward.findMany({
      where,
      orderBy: { cost: 'asc' },
    })

    return success({ data: rewards, total: rewards.length })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { name, type, value, rarity, cost, campaignId } = body

    if (!name || !value || !campaignId) {
      return badRequest('name, value, and campaignId are required')
    }

    const reward = await prisma.campaignReward.create({
      data: {
        name,
        type: type || 'item',
        value,
        rarity: rarity || 'common',
        cost: cost !== undefined ? parseFloat(cost) : 0,
        campaignId,
      },
    })

    return success(reward, 201)
  } catch (error) {
    return serverError(error)
  }
}
