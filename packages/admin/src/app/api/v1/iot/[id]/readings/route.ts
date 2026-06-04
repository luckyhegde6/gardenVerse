import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError, paginated } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit
    const sensorType = searchParams.get('sensorType')

    const where: Record<string, unknown> = { deviceId: params.id }
    if (sensorType) where.sensorType = sensorType.toUpperCase()

    const [readings, total] = await Promise.all([
      prisma.sensorReading.findMany({
        where: where as any,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.sensorReading.count({ where: where as any }),
    ])

    finishRequestLog(ctx, request, 200)
    return paginated(readings, total, page, limit)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const body = await request.json()
    const { sensorType, value, unit } = body as Record<string, unknown>

    if (!sensorType || value === undefined || value === null || !unit) {
      return badRequest('sensorType, value, and unit are required')
    }

    const device = await prisma.iotDevice.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true },
    })

    if (!device) {
      return notFound('Device not found')
    }

    const validSensorTypes = ['SOIL_MOISTURE', 'HUMIDITY', 'PH', 'TEMPERATURE', 'LIGHT']
    const normalizedType = String(sensorType).toUpperCase()

    if (!validSensorTypes.includes(normalizedType)) {
      return badRequest(`Invalid sensorType. Must be one of: ${validSensorTypes.join(', ')}`)
    }

    const reading = await prisma.sensorReading.create({
      data: {
        sensorType: normalizedType as any,
        value: Number(value),
        unit: unit as string,
        deviceId: params.id,
        userId: device.userId,
      },
    })

    await prisma.iotDevice.update({
      where: { id: params.id },
      data: { lastSeenAt: new Date(), isOnline: true },
    })

    finishRequestLog(ctx, request, 201)
    return success(reading, 201)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
