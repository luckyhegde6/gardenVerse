import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { members: true, messages: true } },
        },
      }),
      prisma.group.count(),
    ])

    const mapped = groups.map(g => ({
      id: g.id,
      name: g.name,
      members: g._count.members,
      posts: g._count.messages,
      status: g.isPrivate ? 'private' : 'active',
      created: g.createdAt.toISOString(),
    }))

    return success({ data: mapped, total })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { name, description, type, region, isPrivate } = body

    if (!name || !type) {
      return badRequest('name and type are required')
    }

    const validTypes = ['REGIONAL', 'COMMUNITY', 'TRADE', 'COOPERATIVE']
    if (!validTypes.includes(type)) {
      return badRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        type,
        region: region || null,
        isPrivate: isPrivate === true,
        members: {
          create: {
            userId: auth.payload.userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        },
      },
    })

    return success(group, 201)
  } catch (error) {
    return serverError(error)
  }
}
