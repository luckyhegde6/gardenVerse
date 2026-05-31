import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    return success(reading, 201)
  } catch (error) {
    return serverError(error)
  }
}
