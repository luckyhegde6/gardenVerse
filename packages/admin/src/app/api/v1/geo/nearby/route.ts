import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, badRequest, serverError } from '@/lib/middleware/auth'

function decodeGeohash(geohash: string): { lat: number; lng: number } {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'
  let latInterval: [number, number] = [-90, 90]
  let lngInterval: [number, number] = [-180, 180]
  let isEven = true

  for (let i = 0; i < geohash.length; i++) {
    const cd = BASE32.indexOf(geohash[i])
    for (let j = 4; j >= 0; j--) {
      const mask = 1 << j
      const mid = isEven
        ? (lngInterval[0] + lngInterval[1]) / 2
        : (latInterval[0] + latInterval[1]) / 2
      if (isEven) {
        lngInterval = cd & mask ? [mid, lngInterval[1]] : [lngInterval[0], mid]
      } else {
        latInterval = cd & mask ? [mid, latInterval[1]] : [latInterval[0], mid]
      }
      isEven = !isEven
    }
  }

  return {
    lat: (latInterval[0] + latInterval[1]) / 2,
    lng: (lngInterval[0] + lngInterval[1]) / 2,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const geohash = searchParams.get('geohash')
    const radius = parseInt(searchParams.get('radius') || '10')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!geohash) {
      return badRequest('geohash query parameter is required')
    }

    const precision = radius <= 1 ? 9 : radius <= 5 ? 7 : radius <= 20 ? 6 : 5
    const prefix = geohash.slice(0, precision)

    const users = await prisma.user.findMany({
      where: {
        geohash: { startsWith: prefix },
        garden: { isNot: null },
      },
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        geohash: true,
        region: true,
        sustainabilityScore: true,
      },
    })

    const mapped = users.map((u) => {
      const coords = u.geohash ? decodeGeohash(u.geohash) : null
      return { ...u, latitude: coords?.lat, longitude: coords?.lng }
    })

    return success({ count: mapped.length, gardeners: mapped })
  } catch (error) {
    return serverError(error)
  }
}
