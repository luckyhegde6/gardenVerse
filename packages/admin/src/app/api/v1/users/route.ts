import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { UserRole, type Prisma } from '@prisma/client'
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

    const where: Prisma.UserWhereInput = {}

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
      const roleMap: Record<string, UserRole> = {
        'user': UserRole.USER,
        'moderator': UserRole.MODERATOR,
        'regional_moderator': UserRole.REGIONAL_MODERATOR,
        'admin': UserRole.ADMIN,
        'super_admin': UserRole.SUPER_ADMIN,
      }
      const mappedRole = roleMap[role.toLowerCase()]
      if (mappedRole) where.role = mappedRole
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

    const sortFieldMap: Record<string, Prisma.UserOrderByWithRelationInput> = {
      'createdAt': { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' },
      'email': { email: sortOrder === 'asc' ? 'asc' : 'desc' },
      'username': { username: sortOrder === 'asc' ? 'asc' : 'desc' },
      'level': { level: sortOrder === 'asc' ? 'asc' : 'desc' },
      'experience': { experience: sortOrder === 'asc' ? 'asc' : 'desc' },
      'lastActiveAt': { lastActiveAt: sortOrder === 'asc' ? 'asc' : 'desc' },
      'sustainabilityScore': { sustainabilityScore: sortOrder === 'asc' ? 'asc' : 'desc' },
    }
    const orderBy: Prisma.UserOrderByWithRelationInput = sortFieldMap[sortBy] || { createdAt: 'desc' }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
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
      prisma.user.count({ where }),
    ])

    return paginated(users, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}
