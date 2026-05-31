import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, serverError, notFound } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const section = searchParams.get('section')

  if (section === 'settings') {
    return getSettings()
  }

  return getDashboardStats()
}

export async function PUT(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const section = searchParams.get('section')

  if (section === 'settings') {
    try {
      const body = await request.json()
      return updateSettings(body)
    } catch {
      return badRequest('Invalid JSON body')
    }
  }

  return badRequest('Invalid section')
}

async function getDashboardStats() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      verifiedUsers,
      totalGardens,
      totalCrops,
      activeListings,
      completedTransactions,
      reportsPending,
      activeSessions,
      dau,
      wau,
      mau,
      iotDevices,
      revenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.garden.count(),
      prisma.crop.count(),
      prisma.marketplaceListing.count({ where: { status: 'ACTIVE' } }),
      prisma.marketplaceTransaction.count({ where: { status: 'COMPLETED' } }),
      prisma.moderationReport.count({ where: { status: 'PENDING' } }),
      prisma.session.count({ where: { isRevoked: false, expiresAt: { gt: now } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: todayStart } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: weekStart } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: monthStart } } }),
      prisma.iotDevice.count({ where: { isOnline: true } }),
      prisma.marketplaceTransaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ])

    const creditsIssued = await prisma.tokenTransaction.aggregate({
      where: { type: 'GREEN_CREDITS', action: { not: 'PURCHASE' } },
      _sum: { amount: true },
    })

    const errorsLastHour = await prisma.appLog.count({
      where: { level: 'ERROR', createdAt: { gte: new Date(now.getTime() - 3600000) } },
    })

    const responseTimeLogs = await prisma.appLog.findMany({
      where: { context: 'response_time', createdAt: { gte: new Date(now.getTime() - 3600000) } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const avgApiLatency = responseTimeLogs.length > 0
      ? responseTimeLogs.reduce((sum: number, log) => {
          const metadata = log.metadata as Record<string, unknown> | null
          return sum + ((metadata?.duration as number) || 0)
        }, 0) / responseTimeLogs.length
      : 0

    const serverLoad = await prisma.appLog.count({
      where: { context: 'request', createdAt: { gte: new Date(now.getTime() - 600000) } },
    })

    return success({
      dau,
      wau,
      mau,
      totalUsers,
      verifiedUsers,
      verificationRate: totalUsers > 0 ? `${((verifiedUsers / totalUsers) * 100).toFixed(1)}%` : '0%',
      activeGardens: totalGardens,
      totalCrops,
      marketplaceVolume: activeListings,
      marketplaceTransactions: completedTransactions,
      revenue: revenue._sum.amount || 0,
      creditsIssued: creditsIssued._sum.amount || 0,
      systemUptime: process.uptime(),
      activeIoTDevices: iotDevices,
      pendingReports: reportsPending,
      activeSessions,
      serverLoad,
      apiLatency: Math.round(avgApiLatency),
      errorsLastHour,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    return serverError(error)
  }
}

async function getSettings() {
  try {
    const featureFlags = await prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    })

    return success({
      maintenanceMode: false,
      allowRegistration: true,
      maxGardensPerUser: 5,
      maxCropsPerGarden: 50,
      marketplaceFeePercent: 2,
      defaultGreenCredits: 100,
      apiRateLimit: 100,
      sessionTimeoutMinutes: 15,
      refreshTokenDays: 7,
      featureFlags: featureFlags.map(f => ({
        name: f.name,
        enabled: f.enabled,
        description: f.description,
        rules: f.rules,
      })),
    })
  } catch (error) {
    return serverError(error)
  }
}

async function updateSettings(body: Record<string, unknown>) {
  try {
    if (body.featureFlags && Array.isArray(body.featureFlags)) {
      for (const flag of body.featureFlags) {
        if (flag.name && typeof flag.enabled === 'boolean') {
          await prisma.featureFlag.upsert({
            where: { name: flag.name },
            update: { enabled: flag.enabled, description: flag.description || undefined },
            create: { name: flag.name, enabled: flag.enabled, description: flag.description || undefined },
          })
        }
      }
    }

    return success({ message: 'Settings updated successfully' })
  } catch (error) {
    return serverError(error)
  }
}
