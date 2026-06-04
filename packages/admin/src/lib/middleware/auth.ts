import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-do-not-use-in-production'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export function signToken(payload: JwtPayload, expiresIn = '15m'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  const cookie = request.cookies.get('access_token')
  return cookie?.value || null
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Internal server error'
  return NextResponse.json({ error: message }, { status: 500 })
}

export function success<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function paginated<T>(data: T[], total: number, page: number, limit: number) {
  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}

export function requireAuth(request: NextRequest): { payload: JwtPayload } | { error: NextResponse } {
  const token = getTokenFromRequest(request)
  if (!token) {
    return { error: unauthorized() }
  }
  try {
    const payload = verifyToken(token)
    return { payload }
  } catch {
    return { error: unauthorized('Invalid or expired token') }
  }
}

export function requireRole(request: NextRequest, roles: string[]) {
  const result = requireAuth(request)
  if ('error' in result) return result
  if (!roles.some(r => r.toUpperCase() === result.payload.role.toUpperCase())) {
    return { error: forbidden(`Requires one of roles: ${roles.join(', ')}`) }
  }
  return result
}
