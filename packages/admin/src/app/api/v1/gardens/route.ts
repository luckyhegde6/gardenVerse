import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, badRequest, notFound, serverError, paginated } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (type) where.type = type

    const skip = (page - 1) * limit
    const [gardens, total] = await Promise.all([
      prisma.garden.findMany({
        where,
        include: { crops: true, user: { select: { id: true, username: true, displayName: true, email: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.garden.count({ where }),
    ])

    return paginated(gardens, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { name, type, description, size, soilQuality, irrigationLevel, sunlightExposure, latitude, longitude, address, timezone, theme } = body

    const existing = await prisma.garden.findUnique({ where: { userId: auth.payload.userId } })
    if (existing) {
      return badRequest('User already has a garden')
    }

    const garden = await prisma.garden.create({
      data: {
        name: name || 'My Garden',
        type: type || 'VIRTUAL',
        description,
        size,
        soilQuality: soilQuality ?? 50,
        irrigationLevel: irrigationLevel ?? 50,
        sunlightExposure: sunlightExposure ?? 50,
        latitude,
        longitude,
        address,
        timezone,
        theme,
        userId: auth.payload.userId,
      },
      include: { crops: true },
    })

    return success(garden, 201)
  } catch (error) {
    return serverError(error)
  }
}
