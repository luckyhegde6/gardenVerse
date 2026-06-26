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
    const gardenId = searchParams.get('gardenId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (gardenId) where.gardenId = gardenId
    if (userId) where.userId = userId
    if (status) where.status = status

    const skip = (page - 1) * limit
    const [crops, total] = await Promise.all([
      prisma.crop.findMany({
        where,
        include: { garden: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.crop.count({ where }),
    ])

    return paginated(crops, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const garden = await prisma.garden.findFirst({ where: { userId: auth.payload.userId }, orderBy: { plotNumber: 'asc' } })
    if (!garden) {
      return notFound('User has no garden')
    }

    const body = await request.json()
    const { name, species, variety, plotX, plotY } = body

    if (!name) {
      return badRequest('Name is required')
    }

    const estimatedHarvest = new Date()
    estimatedHarvest.setDate(estimatedHarvest.getDate() + 7)

    const crop = await prisma.crop.create({
      data: {
        name,
        species,
        variety,
        status: 'SEED',
        gardenId: garden.id,
        userId: auth.payload.userId,
        estimatedHarvest,
        plotX,
        plotY,
      },
    })

    return success(crop, 201)
  } catch (error) {
    return serverError(error)
  }
}
