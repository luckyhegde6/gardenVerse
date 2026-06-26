import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, serverError, paginated } from '@/lib/middleware/auth'

const VALID_SOURCES = ['WEATHER', 'PLANT_DB', 'MARKET_DATA']
const VALID_STATUSES = ['SUCCESS', 'FAILED', 'RUNNING', 'PENDING']

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit
    const source = searchParams.get('source')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (source && VALID_SOURCES.includes(source)) {
      where.source = source
    }
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status
    }

    const [syncs, total] = await Promise.all([
      prisma.externalDataSync.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.externalDataSync.count({ where }),
    ])

    const mapped = syncs.map(s => ({
      id: s.id,
      source: s.source,
      status: s.status,
      recordsFetched: s.recordsFetched,
      recordsUpdated: s.recordsUpdated,
      message: s.message,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
    }))

    return paginated(mapped, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}
