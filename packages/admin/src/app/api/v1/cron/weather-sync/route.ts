import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, serverError } from '@/lib/middleware/auth'
import { listTasks, recordTaskRun } from '@/lib/cron'

const CRON_SECRET = process.env.CRON_SECRET || ''

const REGIONS = [
  'IN-KA', 'IN-MH', 'IN-DL', 'IN-TG', 'IN-TN', 'IN-WB', 'IN-GJ', 'IN-UP', 'IN-RJ', 'IN-PB',
]

const CONDITIONS = ['CLEAR', 'PARTLY_CLOUDY', 'CLOUDY', 'RAINY', 'STORMY', 'HAZY'] as const

function randomWeather() {
  const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]
  const baseTemp = condition === 'STORMY' ? 24 : condition === 'RAINY' ? 26 : 30
  return {
    temperature: baseTemp + Math.random() * 8 - 2,
    humidity: condition === 'RAINY' ? 70 + Math.random() * 20 : condition === 'CLEAR' ? 30 + Math.random() * 20 : 45 + Math.random() * 25,
    rainfall: condition === 'RAINY' ? 5 + Math.random() * 20 : condition === 'STORMY' ? 15 + Math.random() * 30 : 0,
    windSpeed: condition === 'STORMY' ? 30 + Math.random() * 30 : condition === 'CLEAR' ? 5 + Math.random() * 10 : 10 + Math.random() * 15,
    sunlightHours: condition === 'CLEAR' ? 10 + Math.random() * 4 : condition === 'CLOUDY' ? 3 + Math.random() * 3 : 5 + Math.random() * 5,
    condition,
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const cronSecret = request.headers.get('x-cron-secret') || ''

  if (cronSecret !== CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    let synced = 0
    let created = 0
    const errors: string[] = []

    for (const region of REGIONS) {
      try {
        const weather = randomWeather()
        const forecast = Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          ...randomWeather(),
        }))

        const existing = await prisma.weatherRecord.findFirst({
          where: { region },
          orderBy: { recordedAt: 'desc' },
        })

        if (existing) {
          await prisma.weatherRecord.update({
            where: { id: existing.id },
            data: {
              temperature: Math.round(weather.temperature * 10) / 10,
              humidity: Math.round(weather.humidity * 10) / 10,
              rainfall: Math.round(weather.rainfall * 10) / 10,
              windSpeed: Math.round(weather.windSpeed * 10) / 10,
              sunlightHours: Math.round(weather.sunlightHours * 10) / 10,
              condition: weather.condition,
              forecast: forecast as any,
              expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
            },
          })
          synced++
        } else {
          await prisma.weatherRecord.create({
            data: {
              region,
              temperature: Math.round(weather.temperature * 10) / 10,
              humidity: Math.round(weather.humidity * 10) / 10,
              rainfall: Math.round(weather.rainfall * 10) / 10,
              windSpeed: Math.round(weather.windSpeed * 10) / 10,
              sunlightHours: Math.round(weather.sunlightHours * 10) / 10,
              condition: weather.condition,
              forecast: forecast as any,
              expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
            },
          })
          created++
        }
      } catch (err) {
        errors.push(`Region ${region}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    recordTaskRun('weather-sync')

    return success({
      processed: true,
      synced,
      created,
      errors: errors.length > 0 ? errors : undefined,
      totalRegions: REGIONS.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return serverError(error)
  }
}
