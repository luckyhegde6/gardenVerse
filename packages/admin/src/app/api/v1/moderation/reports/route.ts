import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, requireRole } from '@/lib/middleware/auth'
import { success, badRequest, serverError, paginated } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status.toUpperCase()
    }

    const [reports, total] = await Promise.all([
      prisma.moderationReport.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          reporter: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          actionedBy: { select: { id: true, username: true, displayName: true } },
        },
      }),
      prisma.moderationReport.count({ where: where as any }),
    ])

    return paginated(reports, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { type, description, targetId, evidence } = body as Record<string, unknown>

    if (!type || typeof type !== 'string') {
      return badRequest('type is required and must be a string')
    }

    const evidenceData: Record<string, unknown> = {}

    if (evidence && typeof evidence === 'object') {
      Object.assign(evidenceData, evidence as Record<string, unknown>)
    }

    if (targetId) {
      evidenceData.targetId = targetId
    }

    const report = await prisma.moderationReport.create({
      data: {
        type,
        description: description as string | undefined,
        evidence: Object.keys(evidenceData).length > 0 ? evidenceData as any : undefined,
        reporterId: auth.payload.userId,
      },
      include: {
        reporter: { select: { id: true, username: true, displayName: true } },
      },
    })

    return success(report, 201)
  } catch (error) {
    return serverError(error)
  }
}
