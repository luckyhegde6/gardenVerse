import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'
import { sanitizeLike } from '@/lib/sanitize'

function getCurrentSeason(): string {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'fall'
  return 'winter'
}

function calculateMatchScore(crop: { minTemp: number; maxTemp: number; difficulty: string }, temperature: number): number {
  let score = 50
  const midTemp = (crop.minTemp + crop.maxTemp) / 2
  const tempDiff = Math.abs(temperature - midTemp)
  const tempRange = crop.maxTemp - crop.minTemp
  score += Math.max(0, 30 - (tempDiff / tempRange) * 30)
  if (crop.difficulty === 'EASY') score += 10
  return Math.round(score)
}

export async function GET(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    const seasonParam = searchParams.get('season')

    const season = seasonParam || getCurrentSeason()

    // Determine effective region from user if not specified
    let effectiveRegion = sanitizeLike(region || '')
    if (!effectiveRegion) {
      const user = await prisma.user.findUnique({
        where: { id: auth.payload.userId },
        select: { region: true },
      })
      effectiveRegion = user?.region || ''
    }

    // Get average temperature for the region
    let temperature = 22 // default
    if (effectiveRegion) {
      const weather = await prisma.weatherRecord.findFirst({
        where: { region: { contains: effectiveRegion, mode: 'insensitive' } },
        orderBy: { recordedAt: 'desc' },
      })
      if (weather) {
        temperature = weather.temperature
      }
    }

    // Fetch plant species from database
    const plants = await prisma.plantSpecies.findMany({
      take: 50,
      orderBy: { commonName: 'asc' },
    })

    // Map plants to crop recommendations
    const cropDatabase = plants.length > 0
      ? plants.map((p) => ({
          name: p.commonName,
          species: p.scientificName,
          seasons: p.seasons,
          difficulty: p.difficulty,
          estimatedYield: 5,
          daysToMaturity: p.growingDays || 60,
          minTemp: p.minTemp || 10,
          maxTemp: p.maxTemp || 35,
          tips: [
            p.waterNeeds === 'HIGH' ? 'Requires consistent watering' : 'Moderate water needs',
            p.sunlightNeeds === 'FULL_SUN' ? 'Needs full sun (6+ hours)' : 'Tolerates partial shade',
          ],
        }))
      : [
          { name: 'Tomato', species: 'Solanum lycopersicum', seasons: ['spring', 'summer'], difficulty: 'MEDIUM', estimatedYield: 5, daysToMaturity: 60, minTemp: 15, maxTemp: 35, tips: ['Require consistent watering', 'Support with stakes or cages'] },
          { name: 'Lettuce', species: 'Lactuca sativa', seasons: ['spring', 'fall'], difficulty: 'EASY', estimatedYield: 3, daysToMaturity: 45, minTemp: 10, maxTemp: 25, tips: ['Harvest outer leaves first', 'Keep soil consistently moist'] },
          { name: 'Basil', species: 'Ocimum basilicum', seasons: ['spring', 'summer'], difficulty: 'EASY', estimatedYield: 6, daysToMaturity: 50, minTemp: 18, maxTemp: 35, tips: ['Pinch tops for bushier growth', 'Needs full sun'] },
          { name: 'Carrot', species: 'Daucus carota', seasons: ['spring', 'fall'], difficulty: 'MEDIUM', estimatedYield: 8, daysToMaturity: 70, minTemp: 10, maxTemp: 25, tips: ['Loose, sandy soil is best', 'Thin seedlings to 2 inches apart'] },
          { name: 'Cucumber', species: 'Cucumis sativus', seasons: ['spring', 'summer'], difficulty: 'EASY', estimatedYield: 10, daysToMaturity: 55, minTemp: 16, maxTemp: 35, tips: ['Trellis for better yields', 'Harvest frequently'] },
          { name: 'Mint', species: 'Mentha spicata', seasons: ['spring', 'summer', 'fall'], difficulty: 'EASY', estimatedYield: 15, daysToMaturity: 30, minTemp: 10, maxTemp: 35, tips: ['Grows vigorously—use containers', 'Harvest leaves regularly'] },
        ]

    // Filter by season and temperature range
    const suitable = cropDatabase.filter((crop) => {
      return crop.seasons.includes(season) &&
        temperature >= crop.minTemp &&
        temperature <= crop.maxTemp
    })

    // Score, sort, and return top 5
    const recommendations = suitable
      .map((crop) => ({
        name: crop.name,
        species: crop.species,
        season,
        difficulty: crop.difficulty,
        estimatedYield: crop.estimatedYield,
        daysToMaturity: crop.daysToMaturity,
        matchScore: calculateMatchScore(crop, temperature),
        tips: crop.tips.slice(0, 2),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5)

    finishRequestLog(ctx, request, 200)
    return success({
      region: effectiveRegion || 'unknown',
      season,
      temperature,
      recommendations,
    })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
