import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getTokenFromRequest, requireAuth, success, serverError } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const token = getTokenFromRequest(request)

    if (token) {
      await prisma.session.updateMany({
        where: { token, isRevoked: false },
        data: { isRevoked: true },
      })
    }

    const response = success({ message: 'Logged out successfully' })
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
      sameSite: 'strict',
    })

    return response
  } catch (error) {
    return serverError(error)
  }
}
