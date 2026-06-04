import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { QrSignatureUtil } from '@/lib/qr-signature.util'
import { requireAuth, success, badRequest, serverError, notFound } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

// Simple in-memory replay cache
const replayCache = new Set<string>()

export async function POST(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const body = await request.json()
    const { sessionId } = body as Record<string, unknown>

    if (!sessionId || typeof sessionId !== 'string') {
      finishRequestLog(ctx, request, 400)
      return badRequest('sessionId is required and must be a string')
    }

    // Find the QR session
    const session = await prisma.qrSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      finishRequestLog(ctx, request, 404)
      return notFound('QR session not found')
    }

    if (session.isUsed) {
      finishRequestLog(ctx, request, 400)
      return badRequest('QR session already used')
    }

    if (session.expiresAt < new Date()) {
      finishRequestLog(ctx, request, 400)
      return badRequest('QR session expired')
    }

    // Verify the signature
    const payload = QrSignatureUtil.verify(session.signature)
    if (!payload) {
      finishRequestLog(ctx, request, 400)
      return badRequest('Invalid QR signature')
    }

    // Check for replay attack
    if (replayCache.has(sessionId)) {
      finishRequestLog(ctx, request, 400)
      return badRequest('QR replay detected - session already consumed')
    }

    replayCache.add(sessionId)

    // Prune old cache entries when exceeding limit
    if (replayCache.size > 10000) {
      replayCache.clear()
    }

    // Mark the session as used
    const updated = await prisma.qrSession.update({
      where: { id: sessionId },
      data: {
        isUsed: true,
        usedById: auth.payload.userId,
      },
    })

    finishRequestLog(ctx, request, 200)
    return success({
      message: 'QR session used successfully',
      type: updated.type,
      payload: updated.payload,
    })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
