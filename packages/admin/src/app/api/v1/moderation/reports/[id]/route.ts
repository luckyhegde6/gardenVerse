import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { Prisma } from '@/lib/prisma/generated/client'
import { requireRole, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = await prisma.moderationReport.findUnique({
      where: { id: params.id },
      include: {
        reporter: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        actionedBy: { select: { id: true, username: true, displayName: true } },
      },
    })

    if (!report) {
      return notFound('Report not found')
    }

    return success(report)
  } catch (error) {
    return serverError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { status, actionTaken } = body as Record<string, unknown>

    const existing = await prisma.moderationReport.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    })

    if (!existing) {
      return notFound('Report not found')
    }

    const validStatuses = ['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']
    const newStatus = typeof status === 'string' ? status.toUpperCase() : existing.status

    if (!validStatuses.includes(newStatus)) {
      return badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }

    const data: Prisma.ModerationReportUpdateInput = {
      status: newStatus,
      actionedBy: { connect: { id: auth.payload.userId } },
    }

    if (actionTaken !== undefined) {
      data.actionTaken = actionTaken as string
    }

    if (newStatus === 'RESOLVED' || newStatus === 'DISMISSED') {
      data.resolvedAt = new Date()
    }

    const report = await prisma.moderationReport.update({
      where: { id: params.id },
      data,
      include: {
        reporter: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        actionedBy: { select: { id: true, username: true, displayName: true } },
      },
    })

    return success(report)
  } catch (error) {
    return serverError(error)
  }
}
