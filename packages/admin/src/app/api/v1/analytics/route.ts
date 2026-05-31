import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'overview'

  switch (type) {
    case 'overview':
      return getOverview()
    case 'users':
      return getUserGrowth()
    case 'engagement':
      return getEngagement()
    case 'revenue':
      return getRevenue()
    default:
      return getOverview()
  }
}

async function getOverview() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [dau, mau, totalUsers, totalGardens, totalCrops, totalListings, totalTransactions, totalGroups, totalMessages] = await Promise.all([
      prisma.user.count({ where: { lastActiveAt: { gte: todayStart } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: monthStart } } }),
      prisma.user.count(),
      prisma.garden.count(),
      prisma.crop.count(),
      prisma.marketplaceListing.count(),
      prisma.marketplaceTransaction.count(),
      prisma.group.count(),
      prisma.message.count(),
    ])

    const regions = await prisma.user.groupBy({
      by: ['region'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    const revenue = await prisma.marketplaceTransaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    })

    const tokenSummary = await prisma.tokenTransaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
    })

    return success({
      date: todayStart.toISOString().split('T')[0],
      dau,
      mau,
      mauChange: mau > 0 ? ((dau / mau) * 100).toFixed(1) + '%' : '0%',
      totalUsers,
      totalGardens,
      totalCrops,
      totalListings,
      totalTransactions,
      totalGroups,
      totalMessages,
      avgCropsPerGarden: totalGardens > 0 ? (totalCrops / totalGardens).toFixed(2) : '0',
      usersWithGardens: totalUsers > 0 ? ((totalGardens / totalUsers) * 100).toFixed(2) + '%' : '0%',
      totalRevenue: revenue._sum.amount || 0,
      tokenSummary: tokenSummary.reduce((acc: Record<string, number>, t) => {
        acc[t.type] = (acc[t.type] || 0) + (t._sum.amount || 0)
        return acc
      }, {} as Record<string, number>),
      topRegions: regions.map(r => ({
        region: r.region || 'unknown',
        userCount: r._count.id,
      })),
    })
  } catch (error) {
    return serverError(error)
  }
}

async function getUserGrowth() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const dailyRegistrations = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM "User"
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    const dailyActiveUsers = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(last_active_at) as date, COUNT(*)::int as count
      FROM "User"
      WHERE last_active_at >= ${thirtyDaysAgo}
      GROUP BY DATE(last_active_at)
      ORDER BY date ASC
    `

    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    })

    const totalUsers = await prisma.user.count()
    const verifiedUsers = await prisma.user.count({ where: { isVerified: true } })
    const blockedUsers = await prisma.user.count({ where: { isBlocked: true } })

    return success({
      totalUsers,
      verifiedUsers,
      blockedUsers,
      verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) + '%' : '0%',
      roleDistribution: roleDistribution.map(r => ({
        role: r.role,
        count: r._count.id,
      })),
      dailyRegistrations: dailyRegistrations.map(r => ({
        date: typeof r.date === 'string' ? r.date : String(r.date),
        count: Number(r.count),
      })),
      dailyActiveUsers: dailyActiveUsers.map(r => ({
        date: typeof r.date === 'string' ? r.date : String(r.date),
        count: Number(r.count),
      })),
    })
  } catch (error) {
    return serverError(error)
  }
}

async function getEngagement() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [totalUsers, totalGardens, totalCrops, totalListings, totalTransactions, totalMessages, totalGroups, scansLastWeek] = await Promise.all([
      prisma.user.count(),
      prisma.garden.count(),
      prisma.crop.count(),
      prisma.marketplaceListing.count(),
      prisma.marketplaceTransaction.count(),
      prisma.message.count(),
      prisma.group.count(),
      prisma.aiScan.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ])

    const totalEnergy = await prisma.userEnergy.count()
    const dailyRewardsClaimed = await prisma.dailyReward.count({
      where: { claimedAt: { gte: todayStart } },
    })

    const topGardeners = await prisma.user.findMany({
      where: { isBlocked: false },
      orderBy: { greenCredits: 'desc' },
      take: 10,
      select: {
        id: true,
        username: true,
        displayName: true,
        level: true,
        greenCredits: true,
        ecoPoints: true,
        trustScore: true,
        _count: { select: { crops: true, listings: true } },
      },
    })

    return success({
      totalUsers,
      totalGardens,
      totalCrops,
      totalListings,
      totalTransactions,
      totalMessages,
      totalGroups,
      scansLastWeek,
      totalEnergyUsers: totalEnergy,
      dailyRewardsClaimed,
      avgCropsPerGarden: totalGardens > 0 ? (totalCrops / totalGardens).toFixed(2) : '0',
      userEngagementRate: totalUsers > 0 ? ((totalGardens / totalUsers) * 100).toFixed(2) + '%' : '0%',
      transactionRate: totalUsers > 0 ? ((totalTransactions / totalUsers) * 100).toFixed(2) + '%' : '0%',
      topGardeners: topGardeners.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        level: u.level,
        greenCredits: u.greenCredits,
        ecoPoints: u.ecoPoints,
        trustScore: u.trustScore,
        crops: u._count.crops,
        listings: u._count.listings,
      })),
    })
  } catch (error) {
    return serverError(error)
  }
}

async function getRevenue() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [completedTransactions, totalRevenue, tokenTransactions, listingCounts] = await Promise.all([
      prisma.marketplaceTransaction.count({ where: { status: 'COMPLETED' } }),
      prisma.marketplaceTransaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.tokenTransaction.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.marketplaceListing.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ])

    const tokenTotals = await prisma.tokenTransaction.groupBy({
      by: ['type', 'action'],
      _sum: { amount: true },
      _count: { id: true },
    })

    const dailyRevenue = await prisma.$queryRaw<Array<{ date: string; amount: bigint; count: bigint }>>`
      SELECT DATE(completed_at) as date, COALESCE(SUM(amount), 0) as amount, COUNT(*)::int as count
      FROM "MarketplaceTransaction"
      WHERE status = 'COMPLETED' AND completed_at >= ${thirtyDaysAgo}
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `

    return success({
      totalTransactions: completedTransactions,
      totalRevenue: totalRevenue._sum.amount || 0,
      averageTransactionValue: completedTransactions > 0
        ? (totalRevenue._sum.amount || 0) / completedTransactions
        : 0,
      listingCategories: listingCounts.map(l => ({
        category: l.category,
        count: l._count.id,
      })),
      tokenActivity: tokenTotals.map(t => ({
        type: t.type,
        action: t.action,
        totalAmount: t._sum.amount || 0,
        transactionCount: t._count.id,
      })),
      recentTransactions: tokenTransactions.map(t => ({
        id: t.id,
        type: t.type,
        action: t.action,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt,
      })),
      dailyRevenue: dailyRevenue.map(r => ({
        date: typeof r.date === 'string' ? r.date : String(r.date),
        amount: Number(r.amount),
        count: Number(r.count),
      })),
    })
  } catch (error) {
    return serverError(error)
  }
}
