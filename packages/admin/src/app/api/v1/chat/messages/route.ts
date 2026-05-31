import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, forbidden, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const otherUserId = searchParams.get('otherUserId')
    const groupId = searchParams.get('groupId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    if (groupId) {
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: auth.payload.userId } },
      })

      if (!membership) return forbidden('Not a member of this group')

      const messages = await prisma.message.findMany({
        where: { groupId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true } },
        },
      })

      return success(messages.reverse())
    }

    if (!otherUserId) return badRequest('otherUserId or groupId is required')

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: auth.payload.userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: auth.payload.userId },
        ],
        groupId: null,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    })

    return success(messages.reverse())
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { content, receiverId, groupId, isEncrypted } = body

    if (!content) return badRequest('content is required')
    if (!receiverId && !groupId) return badRequest('Either receiverId or groupId is required')

    if (groupId) {
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: auth.payload.userId } },
      })

      if (!membership) return forbidden('Not a member of this group')
    }

    const message = await prisma.message.create({
      data: {
        content,
        isEncrypted: isEncrypted !== false,
        senderId: auth.payload.userId,
        receiverId: receiverId || undefined,
        groupId: groupId || undefined,
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    })

    return success(message, 201)
  } catch (error) {
    return serverError(error)
  }
}
