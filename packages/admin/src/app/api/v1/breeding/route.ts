import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError, paginated } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  const userId = auth.payload.userId
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status')

  try {
    const where: Record<string, unknown> = { userId }
    if (status) {
      where.status = status
    }

    const [labs, total] = await Promise.all([
      prisma.breedingLab.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          parent1: {
            select: { id: true, commonName: true, scientificName: true, imageUrl: true },
          },
          parent2: {
            select: { id: true, commonName: true, scientificName: true, imageUrl: true },
          },
          resultSpecies: {
            select: { id: true, commonName: true, scientificName: true, imageUrl: true },
          },
        },
      }),
      prisma.breedingLab.count({ where }),
    ])

    const data = labs.map(lab => ({
      id: lab.id,
      status: lab.status,
      startedAt: lab.startedAt,
      completedAt: lab.completedAt,
      parent1: lab.parent1,
      parent2: lab.parent2,
      resultSpecies: lab.resultSpecies,
    }))

    return paginated(data, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  const userId = auth.payload.userId

  try {
    const body = await request.json()
    const { parent1Id, parent2Id } = body

    if (!parent1Id || !parent2Id) {
      return badRequest('parent1Id and parent2Id are required')
    }

    if (parent1Id === parent2Id) {
      return badRequest('Parent species must be different')
    }

    // Verify both species exist
    const [parent1, parent2] = await Promise.all([
      prisma.plantSpecies.findUnique({ where: { id: parent1Id } }),
      prisma.plantSpecies.findUnique({ where: { id: parent2Id } }),
    ])

    if (!parent1 || !parent2) {
      return badRequest('One or both parent species not found')
    }

    // Check if user already has an active breeding lab
    const activeLab = await prisma.breedingLab.findFirst({
      where: {
        userId,
        status: 'BREEDING',
      },
    })

    if (activeLab) {
      return badRequest('You already have an active breeding lab. Complete it before starting a new one.')
    }

    const lab = await prisma.breedingLab.create({
      data: {
        userId,
        parent1Id,
        parent2Id,
        status: 'BREEDING',
      },
      include: {
        parent1: {
          select: { id: true, commonName: true, scientificName: true, imageUrl: true },
        },
        parent2: {
          select: { id: true, commonName: true, scientificName: true, imageUrl: true },
        },
      },
    })

    return success(
      {
        id: lab.id,
        status: lab.status,
        startedAt: lab.startedAt,
        parent1: lab.parent1,
        parent2: lab.parent2,
      },
      201,
    )
  } catch (error) {
    return serverError(error)
  }
}
