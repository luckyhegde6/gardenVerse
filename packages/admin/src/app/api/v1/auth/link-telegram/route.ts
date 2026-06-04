import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function POST(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const body = await request.json()
    const { telegramId, verificationCode } = body

    if (!telegramId || typeof telegramId !== 'string') {
      finishRequestLog(ctx, request, 400)
      return badRequest('telegramId is required and must be a string')
    }

    if (!verificationCode || typeof verificationCode !== 'string') {
      finishRequestLog(ctx, request, 400)
      return badRequest('verificationCode is required and must be a string')
    }

    // Check if Telegram account is already linked to another user
    const existing = await prisma.user.findFirst({
      where: { telegramId, id: { not: auth.payload.userId } },
      select: { id: true },
    })

    if (existing) {
      finishRequestLog(ctx, request, 409)
      return new Response(
        JSON.stringify({ error: 'Telegram account already linked to another user' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await prisma.user.update({
      where: { id: auth.payload.userId },
      data: { telegramId },
    })

    finishRequestLog(ctx, request, 200)
    return success({ message: 'Telegram account linked successfully' })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
