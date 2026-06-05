import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, requireAuth, success, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const quest = await prisma.quest.findUnique({
      where: { id: params.id },
      include: { season: { select: { id: true, name: true } } },
    })

    if (!quest) {
      return notFound('Quest not found')
    }

    return success(quest)
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    const quest = await prisma.quest.findUnique({ where: { id: params.id } })
    if (!quest) {
      return notFound('Quest not found')
    }

    await prisma.quest.delete({ where: { id: params.id } })

    return success({ message: 'Quest deleted successfully' })
  } catch (error) {
    return serverError(error)
  }
}
