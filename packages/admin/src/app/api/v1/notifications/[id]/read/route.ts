import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError, notFound } from '@/lib/middleware/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { id } = params
    const userId = auth.payload.userId

    const existing = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })
    if (!existing) {
      return notFound('Notification not found')
    }

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    })

    return success({ message: 'Notification marked as read' })
  } catch (error) {
    return serverError(error)
  }
}
