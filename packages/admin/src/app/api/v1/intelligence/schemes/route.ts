import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, serverError, paginated } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function GET(request: NextRequest) {
  const ctx = startRequestLog(request)

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const region = searchParams.get('region')

    const where: Record<string, unknown> = { type: 'SCHEME' }

    if (region) {
      where.region = { contains: region, mode: 'insensitive' }
    }

    const offset = (page - 1) * limit

    const [schemes, total] = await Promise.all([
      prisma.governmentAdvisory.findMany({
        where: where as any,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.governmentAdvisory.count({ where: where as any }),
    ])

    finishRequestLog(ctx, request, 200)
    return paginated(schemes, total, page, limit)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
