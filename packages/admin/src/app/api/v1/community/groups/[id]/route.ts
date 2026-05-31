import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: true, messages: true } },
      },
    })

    if (!group) return notFound('Group not found')

    return success(group)
  } catch (error) {
    return serverError(error)
  }
}
