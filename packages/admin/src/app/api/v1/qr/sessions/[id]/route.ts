import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await prisma.qrSession.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, username: true } },
        usedBy: { select: { id: true, username: true } },
      },
    })

    if (!session) return notFound('QR session not found')

    return success(session)
  } catch (error) {
    return serverError(error)
  }
}
