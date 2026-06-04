import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'
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
    const { deviceId, deviceType } = body

    // Calculate trust score (mirrors backend logic)
    const baseScore = 50
    const deviceBonus = deviceType ? 20 : 0
    const trustScore = Math.min(100, baseScore + deviceBonus)

    await prisma.user.update({
      where: { id: auth.payload.userId },
      data: { deviceTrustScore: trustScore },
    })

    finishRequestLog(ctx, request, 200)
    return success({ trustScore, deviceId: deviceId || null })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
