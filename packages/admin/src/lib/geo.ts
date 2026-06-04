const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

export function decodeGeohash(geohash: string): { lat: number; lng: number } | null {
  if (!geohash || geohash.length < 2) return null

  let latInterval: [number, number] = [-90, 90]
  let lngInterval: [number, number] = [-180, 180]
  let isEven = true

  for (let i = 0; i < geohash.length; i++) {
    const cd = BASE32.indexOf(geohash[i])
    if (cd === -1) return null
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
