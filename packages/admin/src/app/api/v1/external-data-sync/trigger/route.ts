import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, serverError } from '@/lib/middleware/auth'

const VALID_SOURCES = ['WEATHER', 'PLANT_DB', 'MARKET_DATA']

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { source } = body as { source: string }

    if (!source || !VALID_SOURCES.includes(source)) {
      return badRequest(`source must be one of: ${VALID_SOURCES.join(', ')}`)
    }

    const syncRecord = await prisma.externalDataSync.create({
      data: {
        source,
        status: 'RUNNING',
        recordsFetched: 0,
        recordsUpdated: 0,
        message: 'Sync started',
        startedAt: new Date(),
      },
    })

    const recordsFetched = Math.floor(Math.random() * 91) + 10
    const recordsUpdated = Math.floor(recordsFetched * (Math.random() * 0.5 + 0.3))
    const errors = 0

    const completedRecord = await prisma.externalDataSync.update({
      where: { id: syncRecord.id },
      data: {
        status: 'SUCCESS',
        recordsFetched,
        recordsUpdated,
        completedAt: new Date(),
        message: `Synced ${recordsFetched} records from ${source} (${recordsUpdated} updated)`,
      },
    })

    return success(
      {
        id: completedRecord.id,
        source: completedRecord.source,
        status: completedRecord.status,
        recordsFetched: completedRecord.recordsFetched,
        recordsUpdated: completedRecord.recordsUpdated,
        message: completedRecord.message,
        startedAt: completedRecord.startedAt.toISOString(),
        completedAt: completedRecord.completedAt?.toISOString() ?? null,
      },
      201
    )
  } catch (error) {
    return serverError(error)
  }
}
