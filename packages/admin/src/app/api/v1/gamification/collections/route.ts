import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const collections = await prisma.plantCollection.findMany({
      where: { userId: auth.payload.userId },
      include: { species: true },
      orderBy: { discoveredAt: 'desc' },
    })

    return success(collections.map(c => ({
      id: c.id,
      speciesId: c.speciesId,
      speciesName: c.species.commonName,
      scientificName: c.species.scientificName,
      imageUrl: c.species.imageUrl,
      category: c.species.difficulty,
      timesPlanted: c.timesPlanted,
      timesHarvested: c.timesHarvested,
      discoveredAt: c.discoveredAt,
    })))
  } catch (error) {
    return serverError(error)
  }
}
