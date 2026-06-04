import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError, paginated } from '@/lib/middleware/auth'
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

    const where = { sellerId: auth.payload.userId }

    const [items, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        include: {
          transactions: {
            select: { id: true, status: true, amount: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
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
