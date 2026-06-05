import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError, notFound } from '@/lib/middleware/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  const userId = auth.payload.userId
  const { id } = params

  try {
    const lab = await prisma.breedingLab.findUnique({
      where: { id },
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
    })

    if (!lab) {
      return notFound('Breeding lab not found')
    }

    // Users can only view their own labs
    if (lab.userId !== userId) {
      return notFound('Breeding lab not found')
    }

    return success({
      id: lab.id,
      status: lab.status,
      startedAt: lab.startedAt,
      completedAt: lab.completedAt,
      parent1: lab.parent1,
      parent2: lab.parent2,
      resultSpecies: lab.resultSpecies,
    })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const { id } = params

  if (action === 'complete') {
    return completeBreeding(request, id)
  }

  return badRequest('Invalid action')
}

async function completeBreeding(request: NextRequest, labId: string) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  const userId = auth.payload.userId

  try {
    const lab = await prisma.breedingLab.findUnique({
      where: { id: labId },
    })

    if (!lab) {
      return notFound('Breeding lab not found')
    }

    // Users can only complete their own labs
    if (lab.userId !== userId) {
      return notFound('Breeding lab not found')
    }

    if (lab.status === 'COMPLETED') {
      return badRequest('Breeding lab is already completed')
    }

    // Determine result: check if a hybrid already exists for this parent pair
    const existingHybrid = await prisma.plantHybrid.findUnique({
      where: {
        parent1Id_parent2Id: {
          parent1Id: lab.parent1Id,
          parent2Id: lab.parent2Id,
        },
      },
      include: {
        resultSpecies: {
          select: { id: true, commonName: true, scientificName: true, imageUrl: true },
        },
      },
    })

    let resultSpeciesId = lab.resultSpeciesId

    if (existingHybrid?.resultSpeciesId) {
      resultSpeciesId = existingHybrid.resultSpeciesId
    }

    const completedLab = await prisma.breedingLab.update({
      where: { id: labId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        resultSpeciesId,
      },
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
    })

    return success({
      id: completedLab.id,
      status: completedLab.status,
      startedAt: completedLab.startedAt,
      completedAt: completedLab.completedAt,
      parent1: completedLab.parent1,
      parent2: completedLab.parent2,
      resultSpecies: completedLab.resultSpecies,
    })
  } catch (error) {
    return serverError(error)
  }
}
