import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, serverError, notFound } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status && status !== 'ALL') {
      where.status = status
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          _count: { select: { rewardsConfig: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.campaign.count({ where }),
    ])

    const mapped = campaigns.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      participants: c.participants,
      rewards: c.rewards || '',
      schedule: c.schedule,
      description: c.description,
      discountPercent: c.discountPercent,
      minLevel: c.minLevel,
      maxRedemptions: c.maxRedemptions,
      targetUserRole: c.targetUserRole,
      targetGardenType: c.targetGardenType,
      couponCode: c.couponCode,
      rewardsCount: c._count.rewardsConfig,
    }))

    return success({ data: mapped, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const {
      name,
      type,
      status,
      startDate,
      endDate,
      rewards,
      schedule,
      description,
      discountPercent,
      minLevel,
      maxRedemptions,
      targetUserRole,
      targetGardenType,
      couponCode,
    } = body

    if (!name || !type || !startDate || !endDate) {
      return badRequest('name, type, startDate, and endDate are required')
    }

    const validTypes = ['seasonal', 'quest', 'competition', 'event']
    if (!validTypes.includes(type)) {
      return badRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    const validSchedules = ['daily', 'weekly', 'weekends', 'one-time', 'onboarding']
    if (schedule && !validSchedules.includes(schedule)) {
      return badRequest(`schedule must be one of: ${validSchedules.join(', ')}`)
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        type,
        status: status || 'draft',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rewards: rewards || null,
        schedule: schedule || 'one-time',
        description: description || null,
        discountPercent: discountPercent ?? null,
        minLevel: minLevel ?? null,
        maxRedemptions: maxRedemptions ?? null,
        targetUserRole: targetUserRole ?? null,
        targetGardenType: targetGardenType ?? null,
        couponCode: couponCode ?? null,
      },
    })

    return success(campaign, 201)
  } catch (error) {
    return serverError(error)
  }
}
