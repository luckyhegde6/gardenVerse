import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, badRequest, notFound, unauthorized, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const crop = await prisma.crop.findFirst({
      where: { id: params.id },
      include: { garden: { select: { id: true, name: true } }, plantSpecies: true, cropVariety: true },
    })

    if (!crop) {
      return notFound('Crop not found')
    }

    return success(crop)
  } catch (error) {
    return serverError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const crop = await prisma.crop.findFirst({ where: { id: params.id, userId: auth.payload.userId } })
    if (!crop) {
      return notFound('Crop not found')
    }

    const body = await request.json()
    const { action, name, species, variety, status } = body

    if (action === 'water') {
      const hydration = Math.min(100, crop.hydration + 30)
      const updated = await prisma.crop.update({
        where: { id: params.id },
        data: { hydration, lastWateredAt: new Date(), weatherStressed: false, stressFactor: Math.max(0, crop.stressFactor - 20) },
      })
      return success(updated)
    }

    if (action === 'fertilize') {
      const nutrientLevel = Math.min(100, crop.nutrientLevel + 40)
      const updated = await prisma.crop.update({
        where: { id: params.id },
        data: { nutrientLevel, lastFertilizedAt: new Date() },
      })
      return success(updated)
    }

    if (action === 'harvest') {
      if (crop.status !== 'MATURE') {
        return badRequest('Crop is not ready for harvest')
      }

      const yieldAmount = Math.floor(1 + (crop.health / 100) * 5)

      await prisma.inventory.create({
        data: {
          userId: auth.payload.userId,
          itemType: 'HARVEST',
          itemId: params.id,
          name: `${crop.name} Harvest`,
          quantity: yieldAmount,
          rarity: crop.health > 80 ? 'RARE' : crop.health > 50 ? 'UNCOMMON' : 'COMMON',
        },
      })

      const harvested = await prisma.crop.update({
        where: { id: params.id },
        data: { status: 'HARVESTED', harvestedAt: new Date() },
      })

      return success(harvested)
    }

    const updated = await prisma.crop.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(species !== undefined && { species }),
        ...(variety !== undefined && { variety }),
        ...(status !== undefined && { status }),
      },
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

    const crop = await prisma.crop.findFirst({ where: { id: params.id, userId: auth.payload.userId } })
    if (!crop) {
      return notFound('Crop not found')
    }

    await prisma.crop.delete({ where: { id: params.id } })

    return success({ message: 'Crop deleted successfully' })
  } catch (error) {
    return serverError(error)
  }
}
