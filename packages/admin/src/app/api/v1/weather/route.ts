import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole } from '@/lib/middleware/auth'
import { success, badRequest, serverError } from '@/lib/middleware/auth'
import { sanitizeLike } from '@/lib/sanitize'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = sanitizeLike(searchParams.get('region') || 'default')
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined

    const record = await prisma.weatherRecord.findFirst({
      where: {
        region: { contains: region, mode: 'insensitive' },
        expiresAt: { gt: new Date() },
      },
      orderBy: { recordedAt: 'desc' },
    })

    if (record) {
      return success(record)
    }

    const simulated = {
      region,
      temperature: 20 + Math.random() * 10,
      humidity: 40 + Math.random() * 30,
      rainfall: Math.random() * 10,
      windSpeed: Math.random() * 20,
      sunlightHours: 6 + Math.random() * 6,
      condition: 'CLEAR',
      forecast: generateSimulatedForecast(),
    }

    return success(simulated)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { region, temperature, humidity, rainfall, windSpeed, sunlightHours, condition } = body

    if (!region || temperature === undefined || humidity === undefined) {
      return badRequest('region, temperature, and humidity are required')
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 3)

    const record = await prisma.weatherRecord.create({
      data: {
        region,
        temperature,
        humidity,
        rainfall: rainfall || 0,
        windSpeed: windSpeed || 0,
        sunlightHours: sunlightHours || 6,
        condition: condition || 'CLEAR',
        expiresAt,
      },
    })

    return success(record, 201)
  } catch (error) {
    return serverError(error)
  }
}

function generateSimulatedForecast() {
  const days = []
  for (let i = 0; i < 5; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    days.push({
      date: date.toISOString().split('T')[0],
      temperature: { min: 12 + Math.random() * 8, max: 20 + Math.random() * 12 },
      humidity: 40 + Math.random() * 30,
      condition: ['CLEAR', 'CLOUDY', 'RAIN', 'PARTLY_CLOUDY'][Math.floor(Math.random() * 4)],
      precipitation: Math.random() * 40,
    })
  }
  return days
}
