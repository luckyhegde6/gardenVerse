import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { Prisma } from '@prisma/client'
import { requireAuth, success, badRequest, serverError, paginated } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit
    const isAdmin = auth.payload.role.toUpperCase() === 'ADMIN' || auth.payload.role.toUpperCase() === 'SUPER_ADMIN'
    const userId = searchParams.get('userId')

    const where: Prisma.AiScanWhereInput = {}
    if (userId) {
      where.userId = userId
    } else if (!isAdmin) {
      where.userId = auth.payload.userId
    }

    const [scans, total] = await Promise.all([
      prisma.aiScan.findMany({
        where,
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.aiScan.count({ where }),
    ])

    return paginated(scans, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}
