import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = [
  'http://localhost:19006',
  'http://localhost:8081',
  'http://localhost:3000',
  'https://gardenverse.vercel.app',
]

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin)

  if (request.method === 'OPTIONS') {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
    if (isAllowed) {
      headers['Access-Control-Allow-Origin'] = origin
      headers['Access-Control-Allow-Credentials'] = 'true'
    }
    return new NextResponse(null, { status: 204, headers })
  }

  const response = NextResponse.next()
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export const config = {
  matcher: '/api/:path*',
}
