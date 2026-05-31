import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, serverError, notFound } from '@/lib/middleware/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { key: string } },
) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const { key } = params
    const body = await request.json()

    const existing = await prisma.featureFlag.findUnique({
      where: { name: key },
    })
    if (!existing) {
      return notFound(`Feature flag '${key}' not found`)
    }

    const updateData: Record<string, unknown> = {}
    if (body.enabled !== undefined) updateData.enabled = Boolean(body.enabled)
    if (body.description !== undefined) updateData.description = String(body.description)
    if (body.rules !== undefined) updateData.rules = body.rules

    const flag = await prisma.featureFlag.update({
      where: { name: key },
      data: updateData,
    })

    return success(flag)
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } },
) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const { key } = params

    const existing = await prisma.featureFlag.findUnique({
      where: { name: key },
    })
    if (!existing) {
      return notFound(`Feature flag '${key}' not found`)
    }

    await prisma.featureFlag.delete({ where: { name: key } })

    return success({ message: `Flag '${key}' deleted` })
  } catch (error) {
    return serverError(error)
  }
}
