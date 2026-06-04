import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const totalSpecies = await prisma.plantSpecies.count()

    const discovered = await prisma.plantCollection.count({
      where: { userId: auth.payload.userId },
    })

    const mastered = await prisma.speciesMastery.count({
      where: { userId: auth.payload.userId, perfectedAt: { not: null } },
    })

    return success({
      totalSpecies,
      discovered,
      mastered,
      completionRate: totalSpecies > 0 ? Math.round((discovered / totalSpecies) * 100) : 0,
    })
  } catch (error) {
    return serverError(error)
  }
}
