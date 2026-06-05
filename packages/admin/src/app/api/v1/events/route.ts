import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, requireAuth, success, badRequest, serverError, paginated } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'ACTIVE'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // Determine if this is an admin request (explicit status=ALL or non-default status)
  const isAdminRequest = status === 'ALL'
  let userId: string | null = null

  if (isAdminRequest) {
    const adminAuth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
    if ('error' in adminAuth) return adminAuth.error
  } else {
    // Try to authenticate for user progress, but don't fail if no token
    const auth = requireAuth(request)
    if ('payload' in auth) {
      userId = auth.payload.userId
    }
  }

  try {
    const where: Record<string, unknown> = {}

    if (status !== 'ALL') {
      where.status = status
    }

    const [events, total] = await Promise.all([
      prisma.seasonEvent.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { shopItems: true, userProgress: true },
          },
        },
      }),
      prisma.seasonEvent.count({ where }),
    ])

    // Fetch user progress if authenticated
    let progressMap: Record<string, { points: number; tier: number }> = {}
    if (userId) {
      const progressRecords = await prisma.userEventProgress.findMany({
        where: {
          userId,
          seasonEventId: { in: events.map(e => e.id) },
        },
        select: { seasonEventId: true, points: true, tier: true },
      })
      progressMap = Object.fromEntries(
        progressRecords.map(p => [p.seasonEventId, { points: p.points, tier: p.tier }])
      )
    }

    const data = events.map(event => ({
      id: event.id,
      key: event.key,
      name: event.name,
      description: event.description,
      type: event.type,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      icon: event.icon,
      bannerUrl: event.bannerUrl,
      themeColor: event.themeColor,
      shopItemCount: event._count.shopItems,
      participantCount: event._count.userProgress,
      userProgress: progressMap[event.id] || null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }))

    return paginated(data, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()

    if (!body.key || !body.name || !body.startDate || !body.endDate) {
      return badRequest('key, name, startDate, and endDate are required')
    }

    const existing = await prisma.seasonEvent.findUnique({
      where: { key: String(body.key) },
    })
    if (existing) {
      return badRequest('Event with this key already exists')
    }

    const event = await prisma.seasonEvent.create({
      data: {
        key: String(body.key),
        name: String(body.name),
        description: body.description ? String(body.description) : null,
        type: body.type ? String(body.type) : 'SEASONAL',
        status: body.status ? String(body.status) : 'DRAFT',
        startDate: new Date(String(body.startDate)),
        endDate: new Date(String(body.endDate)),
        icon: body.icon ? String(body.icon) : null,
        bannerUrl: body.bannerUrl ? String(body.bannerUrl) : null,
        themeColor: body.themeColor ? String(body.themeColor) : null,
      },
    })

    return success(event, 201)
  } catch (error) {
    return serverError(error)
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return badRequest('id is required for update')
    }

    const existing = await prisma.seasonEvent.findUnique({ where: { id: String(id) } })
    if (!existing) {
      return badRequest('Event not found')
    }

    const updateData: Record<string, unknown> = {}
    if (data.key !== undefined) updateData.key = String(data.key)
    if (data.name !== undefined) updateData.name = String(data.name)
    if (data.description !== undefined) updateData.description = String(data.description)
    if (data.type !== undefined) updateData.type = String(data.type)
    if (data.status !== undefined) updateData.status = String(data.status)
    if (data.startDate !== undefined) updateData.startDate = new Date(String(data.startDate))
    if (data.endDate !== undefined) updateData.endDate = new Date(String(data.endDate))
    if (data.icon !== undefined) updateData.icon = String(data.icon)
    if (data.bannerUrl !== undefined) updateData.bannerUrl = String(data.bannerUrl)
    if (data.themeColor !== undefined) updateData.themeColor = String(data.themeColor)

    const updated = await prisma.seasonEvent.update({
      where: { id: String(id) },
      data: updateData,
    })

    return success(updated)
  } catch (error) {
    return serverError(error)
  }
}
