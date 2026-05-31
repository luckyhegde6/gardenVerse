import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const group = await prisma.group.findUnique({ where: { id: params.id } })
    if (!group) return notFound('Group not found')

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.id, userId: auth.payload.userId } },
    })

    if (existing) return badRequest('Already a member')

    const membership = await prisma.groupMember.create({
      data: { groupId: params.id, userId: auth.payload.userId },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    })

    return success(membership, 201)
  } catch (error) {
    return serverError(error)
  }
}
