import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { QrSignatureUtil } from '@/lib/qr-signature.util'
import { success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, signature } = body

    if (!sessionId || !signature) {
      return badRequest('sessionId and signature are required')
    }

    const session = await prisma.qrSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) return notFound('QR session not found')
    if (session.isUsed) return badRequest('QR session already used')

    if (session.expiresAt < new Date()) {
      return badRequest('QR session expired')
    }

    const payload = QrSignatureUtil.verify(session.signature)
    if (!payload) return badRequest('Invalid QR signature')

    if (QrSignatureUtil.isExpired(payload, 5 * 60 * 1000)) {
      return badRequest('QR payload expired')
    }

    return success({ valid: true, type: session.type, payload: session.payload })
  } catch (error) {
    return serverError(error)
  }
}
