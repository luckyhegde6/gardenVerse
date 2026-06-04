import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { speciesId: string } },
) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const species = await prisma.plantSpecies.findUnique({
      where: { id: params.speciesId },
    })

    if (!species) return notFound('Species not found')

    const mastery = await prisma.speciesMastery.findUnique({
      where: {
        userId_speciesId: {
          userId: auth.payload.userId,
          speciesId: params.speciesId,
        },
      },
    })

    return success({
      id: mastery?.id ?? null,
      speciesId: params.speciesId,
      speciesName: species.commonName,
      level: mastery?.level ?? 1,
      experience: mastery?.experience ?? 0,
      plantCount: mastery?.plantCount ?? 0,
      harvestCount: mastery?.harvestCount ?? 0,
      totalForNextLevel: mastery ? (mastery.level * 100) : 100,
      perfectedAt: mastery?.perfectedAt ?? null,
    })
  } catch (error) {
    return serverError(error)
  }
}
