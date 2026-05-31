import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scan = await prisma.aiScan.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    })

    if (!scan) {
      return notFound('Scan not found')
    }

    return success(scan)
  } catch (error) {
    return serverError(error)
  }
}
