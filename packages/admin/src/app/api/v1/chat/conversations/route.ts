import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const sent = await prisma.message.findMany({
      where: { senderId: auth.payload.userId, groupId: null },
      orderBy: { createdAt: 'desc' },
      distinct: ['receiverId'],
      include: {
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    })

    const received = await prisma.message.findMany({
      where: { receiverId: auth.payload.userId, groupId: null },
      orderBy: { createdAt: 'desc' },
      distinct: ['senderId'],
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    })

    const conversationMap = new Map<string, {
      user: { id: string; username: string; displayName: string | null; avatarUrl: string | null }
      lastMessage: typeof sent[0]
      unread: number
    }>()

    for (const msg of sent) {
      if (!msg.receiverId || !msg.receiver) continue
      const key = msg.receiverId
      if (!conversationMap.has(key) || new Date(conversationMap.get(key)!.lastMessage.createdAt) < new Date(msg.createdAt)) {
        conversationMap.set(key, {
          user: msg.receiver,
          lastMessage: msg,
          unread: 0,
        })
      }
    }

    for (const msg of received) {
      if (!msg.senderId || !msg.sender) continue
      const key = msg.senderId
      const existing = conversationMap.get(key)
      const normalizedMsg = { ...msg, receiver: msg.sender, receiverId: msg.senderId }
      if (!existing || new Date(existing.lastMessage.createdAt) < new Date(msg.createdAt)) {
        conversationMap.set(key, {
          user: msg.sender,
          lastMessage: normalizedMsg,
          unread: existing ? existing.unread + 1 : 1,
        })
      } else if (existing) {
        existing.unread++
      }
    }

    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime(),
    )

    return success(conversations)
  } catch (error) {
    return serverError(error)
  }
}
