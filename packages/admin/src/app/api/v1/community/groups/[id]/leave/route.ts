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
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.id, userId: auth.payload.userId } },
    })

    if (!membership) return notFound('Not a member')
    if (membership.role === 'ADMIN') return badRequest('Admin cannot leave group. Transfer ownership first.')

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: params.id, userId: auth.payload.userId } },
    })

    return success({ message: 'Left group successfully' })
  } catch (error) {
    return serverError(error)
  }
}
