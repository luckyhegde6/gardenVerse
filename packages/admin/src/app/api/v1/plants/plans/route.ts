import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, requireRole } from '@/lib/middleware/auth'
import { success, badRequest, serverError, paginated } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function GET(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const season = searchParams.get('season')
    const difficulty = searchParams.get('difficulty')

    const where: Record<string, unknown> = { isPublic: true }
    if (season) where.season = season
    if (difficulty) where.difficulty = difficulty.toUpperCase()

    const offset = (page - 1) * limit

    const [plans, total] = await Promise.all([
      prisma.gardenPlan.findMany({
        where: where as any,
        include: {
          plants: {
            include: { species: true },
            orderBy: [{ plotY: 'asc' as const }, { plotX: 'asc' as const }],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.gardenPlan.count({ where: where as any }),
    ])

    finishRequestLog(ctx, request, 200)
    return paginated(plans, total, page, limit)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) {
    finishRequestLog(ctx, request, 403)
    return auth.error
  }

  try {
    const body = await request.json()
    const { name, description, season, gridWidth, gridHeight, plants } = body as Record<string, unknown>

    if (!name || typeof name !== 'string') {
      finishRequestLog(ctx, request, 400)
      return badRequest('name is required and must be a string')
    }

    if (!Array.isArray(plants) || plants.length === 0) {
      finishRequestLog(ctx, request, 400)
      return badRequest('plants must be a non-empty array')
    }

    const plan = await prisma.gardenPlan.create({
      data: {
        name,
        description: description as string | undefined,
        season: season as string | undefined,
        gridWidth: (gridWidth as number) || 4,
        gridHeight: (gridHeight as number) || 4,
        isPublic: true,
        createdBy: auth.payload.userId,
        plants: {
          create: (plants as Array<{ speciesId: string; plotX: number; plotY: number; quantity?: number }>).map(p => ({
            speciesId: p.speciesId,
            plotX: p.plotX,
            plotY: p.plotY,
            quantity: p.quantity || 1,
          })),
        },
      },
      include: {
        plants: {
          include: { species: true },
          orderBy: [{ plotY: 'asc' as const }, { plotX: 'asc' as const }],
        },
      },
    })

    finishRequestLog(ctx, request, 201)
    return success(plan, 201)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
