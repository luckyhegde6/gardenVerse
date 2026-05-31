import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, serverError, paginated } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || ''
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (region) {
      where.region = { contains: region, mode: 'insensitive' }
    }

    if (type) {
      where.type = type.toUpperCase()
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [advisories, total] = await Promise.all([
      prisma.governmentAdvisory.findMany({
        where: where as any,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.governmentAdvisory.count({ where: where as any }),
    ])

    return paginated(advisories, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}
