import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { QrSignatureUtil } from '@/lib/qr-signature.util'
import { CryptoUtil } from '@/lib/crypto.util'
import { requireAuth, success, badRequest, serverError } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { type, payload, expiresInSeconds } = body

    if (!type || !payload) {
      return badRequest('type and payload are required')
    }

    const validTypes = ['INVITE', 'MARKETPLACE', 'DEVICE_PAIRING', 'GARDEN_SHARE', 'EVENT']
    if (!validTypes.includes(type)) {
      return badRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (expiresInSeconds || 300))

    const qrPayload = {
      type,
      data: payload,
      nonce: CryptoUtil.generateNonce(),
      createdAt: new Date().toISOString(),
    }

    const signedData = QrSignatureUtil.sign(qrPayload)

    const session = await prisma.qrSession.create({
      data: {
        type,
        payload: payload,
        signature: signedData,
        expiresAt,
        createdById: auth.payload.userId,
      },
    })

    return success({
      sessionId: session.id,
      qrData: signedData,
      expiresAt,
    }, 201)
  } catch (error) {
    return serverError(error)
  }
}
