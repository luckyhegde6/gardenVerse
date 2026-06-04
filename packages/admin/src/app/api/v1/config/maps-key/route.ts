import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  const key = process.env.GOOGLE_MAPS_API_KEY || ''
  if (!key) {
    return NextResponse.json({ key: '' }, { status: 200 })
  }

  return NextResponse.json({ key }, { status: 200 })
}
