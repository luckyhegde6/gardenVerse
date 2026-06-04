import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, serverError } from '@/lib/middleware/auth'

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

function encodeGeohash(lat: number, lng: number, precision: number = 9): string {
  let latInterval: [number, number] = [-90, 90]
  let lngInterval: [number, number] = [-180, 180]
  let geohash = ''
  let isEven = true
  let bit = 0
  let ch = 0

  while (geohash.length < precision) {
    const mid = isEven ? (lngInterval[0] + lngInterval[1]) / 2 : (latInterval[0] + latInterval[1]) / 2
    if (isEven) {
      lngInterval = lng >= mid ? [mid, lngInterval[1]] : [lngInterval[0], mid]
      ch = (ch << 1) | (lng >= mid ? 1 : 0)
    } else {
      latInterval = lat >= mid ? [mid, latInterval[1]] : [latInterval[0], mid]
      ch = (ch << 1) | (lat >= mid ? 1 : 0)
    }
    isEven = !isEven
    if (bit < 4) {
      bit++
    } else {
      geohash += BASE32[ch]
      bit = 0
      ch = 0
    }
  }
  return geohash
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { latitude, longitude, region } = body

    if (latitude === undefined || longitude === undefined) {
      return success({ error: 'latitude and longitude are required' }, 400)
    }

    const geohash = encodeGeohash(Number(latitude), Number(longitude), 9)

    await prisma.user.update({
      where: { id: auth.payload.userId },
      data: { geohash, region: region || undefined },
    })

    return success({ geohash, latitude, longitude, region })
  } catch (error) {
    return serverError(error)
  }
}
