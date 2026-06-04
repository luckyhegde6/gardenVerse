import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { success, badRequest, serverError } from '@/lib/middleware/auth'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { lat, lng } = body

    if (lat === undefined || lng === undefined) {
      return badRequest('lat and lng are required')
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return success({ region: 'Unknown', address: `${lat}, ${lng}` })
    }

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      )
      const data = await res.json()

      if (data.status !== 'OK' || !data.results?.[0]) {
        return success({ region: 'Unknown', address: `${lat}, ${lng}` })
      }

      const result = data.results[0]
      const components = result.address_components || []
      const regionComponent = components.find(
        (c: { types: string[]; long_name: string }) =>
          c.types.includes('administrative_area_level_1') || c.types.includes('country')
      )

      return success({
        region: regionComponent?.long_name || components[0]?.long_name || 'Unknown',
        address: result.formatted_address,
      })
    } catch {
      return success({ region: 'Unknown', address: `${lat}, ${lng}` })
    }
  } catch (error) {
    return serverError(error)
  }
}
