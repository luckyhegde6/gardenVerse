import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { Prisma } from '@prisma/client'
import { requireAuth, success, badRequest, serverError, paginated } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit
    const userId = searchParams.get('userId') || auth.payload.userId

    const where: Prisma.IotDeviceWhereInput = { userId }

    const [devices, total] = await Promise.all([
      prisma.iotDevice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: { select: { sensorReadings: true } },
        },
      }),
      prisma.iotDevice.count({ where }),
    ])

    return paginated(devices, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { name, deviceType, publicKey } = body as Record<string, unknown>

    if (!name || !deviceType) {
      return badRequest('name and deviceType are required')
    }

    const device = await prisma.iotDevice.create({
      data: {
        name: name as string,
        deviceType: deviceType as string,
        publicKey: publicKey as string | undefined,
        userId: auth.payload.userId,
        isOnline: true,
        lastSeenAt: new Date(),
      },
    })

    return success(device, 201)
  } catch (error) {
    return serverError(error)
  }
}
