import { NextRequest } from 'next/server'
import { Prisma } from '@/lib/prisma/generated/client'
import { prisma } from '@/lib/prisma/client'
import { success, serverError } from '@/lib/middleware/auth'
import { sanitizeLike } from '@/lib/sanitize'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = sanitizeLike(searchParams.get('region') || 'default')

    const record = await prisma.weatherRecord.findFirst({
      where: {
        region: { contains: region, mode: 'insensitive' },
        alerts: { not: Prisma.JsonNull },
        expiresAt: { gt: new Date() },
      },
      orderBy: { recordedAt: 'desc' },
    })

    if (record?.alerts) {
      return success(record.alerts)
    }

    return success([])
  } catch (error) {
    return serverError(error)
  }
}
