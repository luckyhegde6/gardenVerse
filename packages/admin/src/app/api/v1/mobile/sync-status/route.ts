import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  try {
    // Check database connectivity
    const userCount = await prisma.user.count()
    const activeUsers = await prisma.session.count({
      where: {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    })

    return NextResponse.json({
      data: {
        connected: true,
        timestamp: new Date().toISOString(),
        database: 'connected',
        totalUsers: userCount,
        activeUsers,
        features: {
          gameSave: true,
          autoSync: true,
          offlineMode: true,
          photoUpload: true,
          aiScan: !!process.env.AI_SERVICE_URL,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        data: {
          connected: false,
          timestamp: new Date().toISOString(),
          error: 'Database connection failed',
        },
      },
      { status: 503 }
    )
  }
}
