import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { Prisma } from '@prisma/client'
import { requireAuth, success, badRequest, serverError, paginated } from '@/lib/middleware/auth'
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const offset = (page - 1) * limit

    // Fetch user to determine region
    const user = await prisma.user.findUnique({
      where: { id: auth.payload.userId },
      select: { id: true, region: true, geohash: true },
    })

    if (!user) {
      finishRequestLog(ctx, request, 404)
      return badRequest('User not found')
    }

    // Build where clause: active listings from same region, excluding user's own
    const where: Prisma.MarketplaceListingWhereInput = {
      status: 'ACTIVE',
      sellerId: { not: auth.payload.userId },
    }

    if (user.region) {
      where.seller = { region: { contains: user.region, mode: 'insensitive' } }
    }

    const [items, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              marketplaceReliability: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.marketplaceListing.count({ where }),
    ])

    finishRequestLog(ctx, request, 200)
    return paginated(items, total, page, limit)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
