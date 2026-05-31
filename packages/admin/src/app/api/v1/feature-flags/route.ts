import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    })

    const overrideCounts = await prisma.userFeatureOverride.groupBy({
      by: ['featureName'],
      _count: { id: true },
    })

    const overrideMap = new Map(overrideCounts.map(o => [o.featureName, o._count.id]))

    return success(flags.map(f => ({
      id: f.id,
      name: f.name,
      key: f.name,
      enabled: f.enabled,
      description: f.description,
      rules: f.rules,
      userOverrideCount: overrideMap.get(f.name) || 0,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })))
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()

    if (!body.name) {
      return badRequest('name is required')
    }

    const existing = await prisma.featureFlag.findUnique({
      where: { name: String(body.name) },
    })
    if (existing) {
      return badRequest('Feature flag with this name already exists')
    }

    const flag = await prisma.featureFlag.create({
      data: {
        name: String(body.name),
        enabled: body.enabled ? Boolean(body.enabled) : false,
        description: body.description ? String(body.description) : null,
        rules: body.rules || undefined,
      },
    })

    return success(flag, 201)
  } catch (error) {
    return serverError(error)
  }
}
