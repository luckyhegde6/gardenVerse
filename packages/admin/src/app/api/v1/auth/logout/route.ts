import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getTokenFromRequest, success, serverError } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  try {
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
    })

    return response
  } catch (error) {
    return serverError(error)
  }
}
