import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError, badRequest } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function GET(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')

    if (!region) {
      // Return stats for all regions (summary)
      const userRegions = await prisma.user.groupBy({
        by: ['region'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        where: { region: { not: null } },
      })

      const stats = await Promise.all(
        userRegions.map(async (r) => {
          const regionName = r.region || 'unknown'
          const [totalGardens, totalCrops] = await Promise.all([
            prisma.garden.count({
              where: { user: { region: regionName } },
            }),
            prisma.crop.count({
              where: { user: { region: regionName } },
            }),
          ])

          return {
            region: regionName,
            totalUsers: r._count.id,
            totalGardens,
            totalCrops,
          }
        }),
      )

      finishRequestLog(ctx, request, 200)
      return success(stats)
    }

    // Return stats for a specific region
    const [totalUsers, totalGardens, totalCrops] = await Promise.all([
      prisma.user.count({
        where: { region: { contains: region, mode: 'insensitive' } },
      }),
      prisma.garden.count({
        where: { user: { region: { contains: region, mode: 'insensitive' } } },
      }),
      prisma.crop.count({
        where: { user: { region: { contains: region, mode: 'insensitive' } } },
      }),
    ])

    finishRequestLog(ctx, request, 200)
    return success({ region, totalUsers, totalGardens, totalCrops })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
