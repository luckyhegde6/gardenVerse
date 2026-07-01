import { NextRequest } from 'next/server'
import { Prisma } from '@/lib/prisma/generated/client'
import { prisma } from '@/lib/prisma/client'
import { success, serverError } from '@/lib/middleware/auth'
import { sanitizeLike } from '@/lib/sanitize'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = sanitizeLike(searchParams.get('region') || 'default')

    const record = await prisma.weatherRecord.findFirst({
      where: {
        region: { contains: region, mode: 'insensitive' },
        forecast: { not: Prisma.JsonNull },
      },
      orderBy: { recordedAt: 'desc' },
    })

    if (record?.forecast) {
      return success(record.forecast)
    }

    const simulated = generateSimulatedForecast()
    return success(simulated)
  } catch (error) {
    return serverError(error)
  }
}

function generateSimulatedForecast() {
  const days = []
  for (let i = 0; i < 7; i++) {
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
