import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError, paginated } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const gardenId = searchParams.get('gardenId')
    const visitorId = searchParams.get('visitorId')

    const where: Record<string, unknown> = {}

    if (gardenId) {
      // Visits to a specific garden — verify the requester owns it
      const garden = await prisma.garden.findUnique({
        where: { id: gardenId },
        select: { userId: true },
      })
      if (!garden) {
        return notFound('Garden not found')
      }
      where.gardenId = gardenId
    } else if (visitorId) {
      // Visits made by a specific visitor
      where.visitorId = visitorId
    } else {
      // Default: visits to the authenticated user's gardens
      const userGardens = await prisma.garden.findMany({
        where: { userId },
        select: { id: true },
      })
      const gardenIds = userGardens.map((g) => g.id)
      where.gardenId = { in: gardenIds }
    }

    const skip = (page - 1) * limit
    const [visits, total] = await Promise.all([
      prisma.gardenVisit.findMany({
        where,
        include: {
          visitor: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          garden: {
            select: { id: true, name: true },
          },
        },
        skip,
        take: limit,
        orderBy: { visitedAt: 'desc' },
      }),
      prisma.gardenVisit.count({ where }),
    ])

    return paginated(visits, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { gardenId, rating, comment } = body as {
      gardenId?: string
      rating?: number
      comment?: string
    }

    if (!gardenId) {
      return badRequest('gardenId is required')
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return badRequest('rating must be between 1 and 5')
    }

    // Verify the garden exists
    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
      select: { id: true, userId: true },
    })

    if (!garden) {
      return notFound('Garden not found')
    }

    // Prevent visiting own garden
    if (garden.userId === auth.payload.userId) {
      return badRequest('Cannot visit your own garden')
    }

    const visit = await prisma.gardenVisit.create({
      data: {
        visitorId: auth.payload.userId,
        gardenId,
        rating: rating ?? null,
        comment: comment ?? null,
      },
      include: {
        visitor: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        garden: {
          select: { id: true, name: true },
        },
      },
    })

    return success(visit, 201)
  } catch (error) {
    return serverError(error)
  }
}
