import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, requireAuth, success, badRequest, serverError, notFound } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (type) where.type = type
    if (unreadOnly) where.isRead = false

    const skip = (page - 1) * limit

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ])

    return success({
      notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()

    if (!body.userId || !body.type || !body.title || !body.body) {
      return badRequest('userId, type, title, and body are required')
    }

    const user = await prisma.user.findUnique({
      where: { id: String(body.userId) },
      select: { id: true },
    })
    if (!user) {
      return notFound('User not found')
    }

    const notification = await prisma.notification.create({
      data: {
        userId: String(body.userId),
        type: String(body.type),
        title: String(body.title),
        body: String(body.body),
        data: body.data || undefined,
        isPush: body.isPush !== undefined ? Boolean(body.isPush) : true,
      },
    })

    return success(notification, 201)
  } catch (error) {
    return serverError(error)
  }
}
