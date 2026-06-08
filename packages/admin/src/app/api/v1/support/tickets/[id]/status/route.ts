import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { Prisma } from '@prisma/client'
import { requireRole, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const { id } = await params
    const body = await request.json()
    const { status, adminNotes } = body

    if (!status) return badRequest('status is required')

    const existing = await prisma.supportTicket.findUnique({ where: { id } })
    if (!existing) return notFound('Support ticket not found')

    const updateData: Prisma.SupportTicketUpdateInput = { status }
    if (adminNotes) updateData.adminNotes = adminNotes as string
    if (status === 'RESOLVED' || status === 'CLOSED') updateData.closedAt = new Date()

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, username: true, email: true } },
        assignedTo: { select: { id: true, username: true } },
      },
    })

    return success(ticket)
  } catch (error) {
    return serverError(error)
  }
}
