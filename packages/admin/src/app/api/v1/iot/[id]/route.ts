import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const device = await prisma.iotDevice.findUnique({
      where: { id: params.id },
      include: {
        sensorReadings: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    })

    if (!device) {
      return notFound('Device not found')
    }

    return success(device)
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const device = await prisma.iotDevice.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true },
    })

    if (!device) {
      return notFound('Device not found')
    }

    if (device.userId !== auth.payload.userId && !['ADMIN', 'SUPER_ADMIN'].includes(auth.payload.role)) {
      return notFound('Device not found')
    }

    await prisma.sensorReading.deleteMany({ where: { deviceId: params.id } })
    await prisma.iotDevice.delete({ where: { id: params.id } })

    return success({ message: 'Device removed successfully' })
  } catch (error) {
    return serverError(error)
  }
}
