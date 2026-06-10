import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, requireAuth, success, badRequest, serverError, notFound } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const admin = searchParams.get('admin')

  // Admin mode: list all quests with pagination and optional category filter
  if (admin === 'true') {
    const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    try {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const category = searchParams.get('category')

      const where: Record<string, unknown> = {}
      if (category) where.category = category

      const [quests, total] = await Promise.all([
        prisma.quest.findMany({
          where,
          orderBy: { sortOrder: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
          include: { season: { select: { id: true, name: true } } },
        }),
        prisma.quest.count({ where }),
      ])

      return success({
        data: quests,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    } catch (error) {
      return serverError(error)
    }
  }

  // Mobile mode: return active quests with user progress
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId

    const [quests, userProgress] = await Promise.all([
      prisma.quest.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { season: { select: { id: true, name: true } } },
      }),
      prisma.userQuest.findMany({
        where: { userId },
        select: { questId: true, progress: true, isCompleted: true, completedAt: true, claimedAt: true },
      }),
    ])

    const progressMap = new Map(userProgress.map(up => [up.questId, up]))

    const questsWithProgress = quests.map(quest => ({
      ...quest,
      userProgress: progressMap.get(quest.id) || null,
    }))

    return success(questsWithProgress)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()

    if (!body.key || !body.title) {
      return badRequest('key and title are required')
    }

    const existing = await prisma.quest.findUnique({
      where: { key: String(body.key) },
    })
    if (existing) {
      return badRequest('Quest with this key already exists')
    }

    const createData: Record<string, unknown> = {
      key: String(body.key),
      title: String(body.title),
      category: body.category ? String(body.category) : 'DAILY',
      type: body.type ? String(body.type) : 'PLANT',
      targetCount: body.targetCount ? Number(body.targetCount) : 1,
      xpReward: body.xpReward ? Number(body.xpReward) : 0,
      creditReward: body.creditReward ? Number(body.creditReward) : 0,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
    }
    if (body.description !== undefined) createData.description = String(body.description)
    if (body.itemReward !== undefined) createData.itemReward = String(body.itemReward)
    if (body.icon !== undefined) createData.icon = String(body.icon)
    if (body.seasonId !== undefined) createData.seasonId = String(body.seasonId)

    const quest = await prisma.quest.create({
      data: createData as Parameters<typeof prisma.quest.create>[0]['data'],
    })

    return success(quest, 201)
  } catch {
    return badRequest('Invalid JSON body')
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

    const existing = await prisma.quest.findUnique({ where: { id: String(id) } })
    if (!existing) {
      return notFound('Quest not found')
    }

    const updateData: Record<string, unknown> = {}
    if (data.key !== undefined) updateData.key = String(data.key)
    if (data.title !== undefined) updateData.title = String(data.title)
    if (data.description !== undefined) updateData.description = String(data.description)
    if (data.category !== undefined) updateData.category = String(data.category)
    if (data.type !== undefined) updateData.type = String(data.type)
    if (data.targetCount !== undefined) updateData.targetCount = Number(data.targetCount)
    if (data.xpReward !== undefined) updateData.xpReward = Number(data.xpReward)
    if (data.creditReward !== undefined) updateData.creditReward = Number(data.creditReward)
    if (data.itemReward !== undefined) updateData.itemReward = String(data.itemReward)
    if (data.icon !== undefined) updateData.icon = String(data.icon)
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive)
    if (data.sortOrder !== undefined) updateData.sortOrder = Number(data.sortOrder)
    if (data.seasonId !== undefined) updateData.seasonId = data.seasonId ? String(data.seasonId) : null

    const updated = await prisma.quest.update({
      where: { id: String(id) },
      data: updateData,
    })

    return success(updated)
  } catch {
    return badRequest('Invalid JSON body')
  }
}
