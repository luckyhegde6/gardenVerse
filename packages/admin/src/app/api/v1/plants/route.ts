import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, requireRole } from '@/lib/middleware/auth'
import { success, badRequest, serverError, paginated } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const q = searchParams.get('q')
    const difficulty = searchParams.get('difficulty')
    const season = searchParams.get('season')
    const edible = searchParams.get('edible')

    const where: Record<string, unknown> = {}

    if (q) {
      where.OR = [
        { commonName: { contains: q, mode: 'insensitive' } },
        { scientificName: { contains: q, mode: 'insensitive' } },
        { family: { contains: q, mode: 'insensitive' } },
        { tags: { has: q.toLowerCase() } },
      ]
    }

    if (difficulty) where.difficulty = difficulty.toUpperCase()
    if (season) where.seasons = { has: season.toLowerCase() }
    if (edible !== null && edible !== undefined) where.edible = edible === 'true'

    const skip = (page - 1) * limit
    const [plants, total] = await Promise.all([
      prisma.plantSpecies.findMany({
        where,
        skip,
        take: limit,
        orderBy: { commonName: 'asc' },
      }),
      prisma.plantSpecies.count({ where }),
    ])

    return paginated(plants, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { commonName, scientificName, family, genus, species, imageUrl, description, growingDays, difficulty, minTemp, maxTemp, waterNeeds, sunlightNeeds, soilPhMin, soilPhMax, matureHeightCm, spacingCm, seasons, edible, medicinal, attractsPollinators, isNative, tags, dataSource, externalId } = body

    if (!commonName || !scientificName) {
      return badRequest('commonName and scientificName are required')
    }

    const existing = await prisma.plantSpecies.findUnique({ where: { scientificName } })
    if (existing) {
      return badRequest('Plant species with this scientific name already exists')
    }

    const plant = await prisma.plantSpecies.create({
      data: {
        commonName,
        scientificName,
        family,
        genus,
        species,
        imageUrl,
        description,
        growingDays,
        difficulty: difficulty || 'MEDIUM',
        minTemp,
        maxTemp,
        waterNeeds: waterNeeds || 'MODERATE',
        sunlightNeeds: sunlightNeeds || 'FULL_SUN',
        soilPhMin,
        soilPhMax,
        matureHeightCm,
        spacingCm,
        seasons: seasons || ['spring', 'summer'],
        edible: edible ?? false,
        medicinal: medicinal ?? false,
        attractsPollinators: attractsPollinators ?? false,
        isNative: isNative ?? false,
        tags: tags || [],
        dataSource: dataSource || 'manual',
        externalId,
      },
    })

    return success(plant, 201)
  } catch (error) {
    return serverError(error)
  }
}
