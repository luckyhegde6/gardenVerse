import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError, paginated } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { imageUrl, plantName, species, healthScore, diseases, recommendations } = body as Record<string, unknown>

    if (!imageUrl) {
      return badRequest('imageUrl is required')
    }

    const scan = await prisma.aiScan.create({
      data: {
        imageUrl: imageUrl as string,
        plantName: plantName as string | undefined,
        species: species as string | undefined,
        healthScore: healthScore !== undefined ? Number(healthScore) : undefined,
        diseases: diseases ? (typeof diseases === 'string' ? JSON.parse(diseases as string) : diseases) : undefined,
        recommendations: recommendations ? (typeof recommendations === 'string' ? JSON.parse(recommendations as string) : recommendations) : undefined,
        userId: auth.payload.userId,
      },
    })

    if (scan.healthScore !== null && scan.healthScore < 70) {
      await prisma.notification.create({
        data: {
          userId: auth.payload.userId,
          type: 'DISEASE_WARNING',
          title: 'Potential Plant Issue Detected',
          body: `AI analysis of ${scan.plantName || 'your plant'} shows potential health issues (score: ${scan.healthScore}). Check recommendations.`,
          data: { scanId: scan.id },
        },
      }).catch(() => {})
    }

    return success(scan, 201)
  } catch (error) {
    return serverError(error)
  }
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit
    const userId = searchParams.get('userId') || auth.payload.userId

    const where: Record<string, unknown> = { userId }

    const [scans, total] = await Promise.all([
      prisma.aiScan.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.aiScan.count({ where: where as any }),
    ])

    return paginated(scans, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}
