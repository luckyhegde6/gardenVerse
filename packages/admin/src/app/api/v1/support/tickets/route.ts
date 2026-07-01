import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { Prisma } from '@/lib/prisma/generated/client'
import { requireRole, success, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const offset = (page - 1) * limit

    const where: Prisma.SupportTicketWhereInput = {}
    if (status) where.status = status

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, username: true, email: true } },
          assignedTo: { select: { id: true, username: true } },
        },
      }),
      prisma.supportTicket.count({ where }),
    ])

    return success({ tickets, total, page, limit })
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { subject, message, priority, userId } = body
    if (!subject || !message) {
      return new Response(JSON.stringify({ error: 'subject and message are required' }), { status: 400 })
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        message,
        priority: priority || 'MEDIUM',
        userId: userId || auth.payload.userId,
      },
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    })

    return new Response(JSON.stringify(ticket), { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}
