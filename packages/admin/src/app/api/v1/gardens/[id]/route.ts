import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, badRequest, notFound, unauthorized, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const garden = await prisma.garden.findUnique({
      where: { id: params.id },
      include: { crops: true, user: { select: { id: true, username: true, displayName: true, email: true } } },
    })

    if (!garden) {
      return notFound('Garden not found')
    }

    return success(garden)
  } catch (error) {
    return serverError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const garden = await prisma.garden.findUnique({ where: { id: params.id } })
    if (!garden) {
      return notFound('Garden not found')
    }

    if (garden.userId !== auth.payload.userId && auth.payload.role.toUpperCase() !== 'ADMIN' && auth.payload.role.toUpperCase() !== 'SUPER_ADMIN') {
      return unauthorized('Not authorized to update this garden')
    }

    const body = await request.json()
    const { name, type, description, size, soilQuality, irrigationLevel, sunlightExposure, latitude, longitude, address, timezone, theme, gridWidth, gridHeight, irrigationType, wateringMode, hasMotorPump } = body

    const updated = await prisma.garden.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description }),
        ...(size !== undefined && { size }),
        ...(soilQuality !== undefined && { soilQuality }),
        ...(irrigationLevel !== undefined && { irrigationLevel }),
        ...(sunlightExposure !== undefined && { sunlightExposure }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(address !== undefined && { address }),
        ...(timezone !== undefined && { timezone }),
        ...(theme !== undefined && { theme }),
        ...(gridWidth !== undefined && { gridWidth }),
        ...(gridHeight !== undefined && { gridHeight }),
        ...(irrigationType !== undefined && { irrigationType }),
        ...(wateringMode !== undefined && { wateringMode }),
        ...(hasMotorPump !== undefined && { hasMotorPump }),
      },
      include: { crops: true },
    })

    return success(updated)
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const garden = await prisma.garden.findUnique({ where: { id: params.id } })
    if (!garden) {
      return notFound('Garden not found')
    }

    if (garden.userId !== auth.payload.userId && auth.payload.role.toUpperCase() !== 'ADMIN' && auth.payload.role.toUpperCase() !== 'SUPER_ADMIN') {
      return unauthorized('Not authorized to delete this garden')
    }

    await prisma.crop.deleteMany({ where: { gardenId: params.id } })
    await prisma.garden.delete({ where: { id: params.id } })

    return success({ message: 'Garden deleted successfully' })
  } catch (error) {
    return serverError(error)
  }
}
