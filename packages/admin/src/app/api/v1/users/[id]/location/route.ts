import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, notFound, serverError } from '@/lib/middleware/auth'

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

function decodeGeohash(geohash: string): { lat: number; lng: number } | null {
  if (!geohash || geohash.length < 2) return null
  let latInterval: [number, number] = [-90, 90]
  let lngInterval: [number, number] = [-180, 180]
  let isEven = true
  for (let i = 0; i < geohash.length; i++) {
    const cd = BASE32.indexOf(geohash[i])
    if (cd === -1) return null
    for (let j = 4; j >= 0; j--) {
      const mask = 1 << j
      if (isEven) {
        const mid = (lngInterval[0] + lngInterval[1]) / 2
        lngInterval = cd & mask ? [mid, lngInterval[1]] : [lngInterval[0], mid]
      } else {
        const mid = (latInterval[0] + latInterval[1]) / 2
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, username: true, geohash: true, region: true },
    })

    if (!user) return notFound('User')

    const coords = user.geohash ? decodeGeohash(user.geohash) : null

    return success({
      id: user.id,
      username: user.username,
      geohash: user.geohash,
      region: user.region,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    })
  } catch (error) {
    return serverError(error)
  }
}
