import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError } from '@/lib/middleware/auth'

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
