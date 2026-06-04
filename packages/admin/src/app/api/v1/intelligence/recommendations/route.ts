import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { region, season, gardenId } = body as Record<string, unknown>

    const userId = auth.payload.userId

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, region: true, level: true, trustScore: true, sustainabilityScore: true },
    })

    const effectiveRegion = (region as string) || currentUser?.region || ''

    const [garden, crops, weather, advisories] = await Promise.all([
      gardenId
        ? prisma.garden.findUnique({
            where: { id: gardenId as string },
            select: { id: true, soilQuality: true, sunlightExposure: true, irrigationLevel: true },
          })
        : null,
      prisma.crop.findMany({
        where: { userId },
        select: { id: true, name: true, species: true, status: true, health: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.weatherRecord.findFirst({
        where: { region: effectiveRegion || undefined },
        orderBy: { recordedAt: 'desc' },
      }),
      prisma.governmentAdvisory.findMany({
        where: {
          region: { contains: effectiveRegion, mode: 'insensitive' },
          expiresAt: { gte: new Date() },
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      }),
    ])

    const nearbyGardeners = await prisma.user.findMany({
      where: {
        region: effectiveRegion || undefined,
        id: { not: userId },
        isBlocked: false,
      },
      select: { id: true, username: true, displayName: true, trustScore: true },
      orderBy: { trustScore: 'desc' },
      take: 5,
    })

    const recommendations = {
      user: currentUser
        ? {
            level: currentUser.level,
            trustScore: currentUser.trustScore,
            sustainabilityScore: currentUser.sustainabilityScore,
          }
        : null,
      garden: garden
        ? {
            soilQuality: garden.soilQuality,
            sunlightExposure: garden.sunlightExposure,
            irrigationLevel: garden.irrigationLevel,
          }
        : null,
      crops: crops.map((c) => ({
        id: c.id,
        name: c.name,
        species: c.species,
        status: c.status,
        health: c.health,
        needsAttention: c.health < 60 || c.status === 'WILTED' || c.status === 'DISEASED',
      })),
      weather: weather
        ? {
            condition: weather.condition,
            temperature: weather.temperature,
            humidity: weather.humidity,
            rainfall: weather.rainfall,
          }
        : null,
      advisories: advisories.map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        region: a.region,
      })),
      nearbyGardeners,
      suggestions: [] as string[],
    }

    const suggestions: string[] = []

    const needyCrops = recommendations.crops.filter((c) => c.needsAttention)
    if (needyCrops.length > 0) {
      suggestions.push(`${needyCrops.length} crop(s) need attention — check health for ${needyCrops.map((c) => c.name).join(', ')}`)
    }

    if (weather && weather.condition) {
      suggestions.push(`Current weather: ${weather.condition}, ${weather.temperature}°C`)
    }

    if (advisories.length > 0) {
      suggestions.push(`${advisories.length} active agricultural advisories in your region`)
    }

    if (garden && garden.soilQuality < 40) {
      suggestions.push('Soil quality is low — consider adding compost or fertilizer')
    }

    if (nearbyGardeners.length > 0) {
      suggestions.push(`Connect with ${nearbyGardeners.length} nearby gardeners in your community`)
    }

    recommendations.suggestions = suggestions

    return success(recommendations)
  } catch (error) {
    return serverError(error)
  }
}
