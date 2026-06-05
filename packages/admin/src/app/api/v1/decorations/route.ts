import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError, notFound } from '@/lib/middleware/auth'

// ---------------------------------------------------------------------------
// GET  - list user's decorations, optionally filtered by ?gardenId=xxx
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const gardenId = searchParams.get('gardenId')
    const userId = auth.payload.userId

    const where: Record<string, unknown> = { userId }
    if (gardenId) where.gardenId = gardenId

    const decorations = await prisma.userGardenDecoration.findMany({
      where,
      include: {
        garden: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return success(decorations)
  } catch (error) {
    return serverError(error)
  }
}

// ---------------------------------------------------------------------------
// POST  - add a decoration to the user's garden
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()

    if (!body.gardenId || !body.decorationType || !body.name) {
      return badRequest('gardenId, decorationType, and name are required')
    }

    const userId = auth.payload.userId
    const gardenId = String(body.gardenId)

    // Verify garden exists and belongs to user
    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
    })
    if (!garden) {
      return notFound('Garden not found')
    }
    if (garden.userId !== userId) {
      return badRequest('Garden does not belong to the current user')
    }

    const decoration = await prisma.userGardenDecoration.create({
      data: {
        decorationType: String(body.decorationType),
        name: String(body.name),
        position: body.position || undefined,
        userId,
        gardenId,
      },
      include: {
        garden: { select: { id: true, name: true } },
      },
    })

    return success(decoration, 201)
  } catch (error) {
    return serverError(error)
  }
}

// ---------------------------------------------------------------------------
// PATCH  - update decoration position  { decorationId, position: { x, y } }
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()

    if (!body.decorationId || !body.position) {
      return badRequest('decorationId and position are required')
    }

    const decoration = await prisma.userGardenDecoration.findUnique({
      where: { id: String(body.decorationId) },
    })
    if (!decoration) {
      return notFound('Decoration not found')
    }
    if (decoration.userId !== auth.payload.userId) {
      return badRequest('Decoration does not belong to the current user')
    }

    const updated = await prisma.userGardenDecoration.update({
      where: { id: String(body.decorationId) },
      data: {
        position: body.position,
      },
      include: {
        garden: { select: { id: true, name: true } },
      },
    })

    return success(updated)
  } catch (error) {
    return serverError(error)
  }
}

// ---------------------------------------------------------------------------
// DELETE  - remove decoration by query param ?id=xxx
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return badRequest('id query parameter is required')
    }

    const decoration = await prisma.userGardenDecoration.findUnique({
      where: { id },
    })
    if (!decoration) {
      return notFound('Decoration not found')
    }
    if (decoration.userId !== auth.payload.userId) {
      return badRequest('Decoration does not belong to the current user')
    }

    await prisma.userGardenDecoration.delete({ where: { id } })

    return success({ deleted: true, id })
  } catch (error) {
    return serverError(error)
  }
}
