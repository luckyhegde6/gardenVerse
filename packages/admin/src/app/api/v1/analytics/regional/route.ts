import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const regions = await prisma.user.groupBy({
      by: ['region'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    const regionNames = regions.map(r => r.region).filter(Boolean) as string[]

    const gardenCounts = regionNames.length > 0
      ? await Promise.all(
          regionNames.map(region =>
            prisma.garden.count({
              where: { user: { region } },
            })
          )
        )
      : []

    const entries = regions.map((r, i) => {
      const userCount = r._count.id
      return {
        region: r.region || 'unknown',
        users: userCount,
        gardens: gardenCounts[i] || 0,
        iotDevices: 0,
        engagementRate: Math.min(100, Math.round((userCount / Math.max(1, regions[0]._count.id)) * 80 + 10)),
      }
    })

    return success({ regions: entries })
  } catch (error) {
    return serverError(error)
  }
}
