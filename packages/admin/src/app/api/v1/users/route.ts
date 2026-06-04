import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, paginated, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const region = searchParams.get('region') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: Record<string, unknown> = {}

    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (region) {
      where.region = region
    }

    if (role) {
      const roleMap: Record<string, string> = {
        'user': 'USER',
        'moderator': 'MODERATOR',
        'regional_moderator': 'REGIONAL_MODERATOR',
        'admin': 'ADMIN',
        'super_admin': 'SUPER_ADMIN',
      }
      where.role = roleMap[role.toLowerCase()] || role.toUpperCase()
    }

    if (status === 'blocked') {
      where.isBlocked = true
    } else if (status === 'active') {
      where.isBlocked = false
    } else if (status === 'unverified') {
      where.isVerified = false
    } else if (status === 'deleted') {
      where.deletedAt = { not: null }
    } else {
      where.deletedAt = null
    }

    const orderBy: Record<string, string> = {}
    const sortFieldMap: Record<string, string> = {
      'createdAt': 'createdAt',
      'email': 'email',
      'username': 'username',
      'level': 'level',
      'experience': 'experience',
      'lastActiveAt': 'lastActiveAt',
      'sustainabilityScore': 'sustainabilityScore',
    }
    orderBy[sortFieldMap[sortBy] || 'createdAt'] = sortOrder === 'asc' ? 'asc' : 'desc'

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: where as any,
        orderBy: orderBy as any,
        take: limit,
        skip: offset,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          isVerified: true,
          isBlocked: true,
          isOnboarded: true,
          region: true,
          geohash: true,
          level: true,
          experience: true,
          greenCredits: true,
          ecoPoints: true,
          sustainabilityScore: true,
          lastActiveAt: true,
          createdAt: true,
          deletedAt: true,
          _count: { select: { crops: true } },
        },
      }),
      prisma.user.count({ where: where as any }),
    ])

    return paginated(users, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}
