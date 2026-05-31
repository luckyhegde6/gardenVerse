import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, requireRole } from '@/lib/middleware/auth'
import { success, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const plant = await prisma.plantSpecies.findUnique({
      where: { id: params.id },
      include: { cropVarieties: true },
    })

    if (!plant) {
      return notFound('Plant species not found')
    }

    return success(plant)
  } catch (error) {
    return serverError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { commonName, scientificName, family, genus, species, imageUrl, description, growingDays, difficulty, minTemp, maxTemp, waterNeeds, sunlightNeeds, soilPhMin, soilPhMax, matureHeightCm, spacingCm, seasons, edible, medicinal, attractsPollinators, isNative, tags, dataSource, externalId } = body

    const existing = await prisma.plantSpecies.findUnique({ where: { id: params.id } })
    if (!existing) {
      return notFound('Plant species not found')
    }

    const plant = await prisma.plantSpecies.update({
      where: { id: params.id },
      data: {
        ...(commonName !== undefined && { commonName }),
        ...(scientificName !== undefined && { scientificName }),
        ...(family !== undefined && { family }),
        ...(genus !== undefined && { genus }),
        ...(species !== undefined && { species }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(description !== undefined && { description }),
        ...(growingDays !== undefined && { growingDays }),
        ...(difficulty !== undefined && { difficulty }),
        ...(minTemp !== undefined && { minTemp }),
        ...(maxTemp !== undefined && { maxTemp }),
        ...(waterNeeds !== undefined && { waterNeeds }),
        ...(sunlightNeeds !== undefined && { sunlightNeeds }),
        ...(soilPhMin !== undefined && { soilPhMin }),
        ...(soilPhMax !== undefined && { soilPhMax }),
        ...(matureHeightCm !== undefined && { matureHeightCm }),
        ...(spacingCm !== undefined && { spacingCm }),
        ...(seasons !== undefined && { seasons }),
        ...(edible !== undefined && { edible }),
        ...(medicinal !== undefined && { medicinal }),
        ...(attractsPollinators !== undefined && { attractsPollinators }),
        ...(isNative !== undefined && { isNative }),
        ...(tags !== undefined && { tags }),
        ...(dataSource !== undefined && { dataSource }),
        ...(externalId !== undefined && { externalId }),
      },
    })

    return success(plant)
  } catch (error) {
    return serverError(error)
  }
}
