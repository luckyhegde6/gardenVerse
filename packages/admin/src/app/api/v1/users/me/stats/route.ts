import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  const userId = auth.payload.userId

  try {
    const [
      gardenCount,
      cropCount,
      matureCrops,
      wiltingCrops,
      harvestCount,
      totalCollections,
      totalSpecies,
      user,
      groupCount,
      recentNotifications,
      recentCrops,
    ] = await Promise.all([
      // Total gardens owned
      prisma.garden.count({ where: { userId } }),

      // Total crops across all gardens
      prisma.crop.count({ where: { userId } }),

      // Crops with status MATURE
      prisma.crop.count({ where: { userId, status: 'MATURE' } }),

      // Crops with health < 25
      prisma.crop.count({ where: { userId, health: { lt: 25 } } }),

      // Crops with status HARVESTED
      prisma.crop.count({ where: { userId, status: 'HARVESTED' } }),

      // Species discovered by the user
      prisma.plantCollection.count({ where: { userId } }),

      // Total species in the database
      prisma.plantSpecies.count(),

      // User record for streaks
      prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, longestStreak: true },
      }),

      // Groups the user is a member of
      prisma.groupMember.count({ where: { userId } }),

      // Last 5 notifications for activity log
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { type: true, title: true, createdAt: true },
      }),

      // Last 5 crops for activity log fallback
      prisma.crop.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, name: true, status: true, plantedAt: true, harvestedAt: true, updatedAt: true },
      }),
    ])

    // Build recentActivity from notifications and crops
    const activityFromNotifications = recentNotifications.map((n) => ({
      type: n.type,
      description: n.title,
      timestamp: n.createdAt.toISOString(),
    }))

    const activityFromCrops = recentCrops.map((c) => {
      let type: string
      let description: string
      let timestamp: Date

      switch (c.status) {
        case 'HARVESTED':
          type = 'HARVEST'
          description = `Harvested ${c.name}`
          timestamp = c.harvestedAt || c.updatedAt
          break
        case 'MATURE':
          type = 'MATURE'
          description = `${c.name} is ready to harvest`
          timestamp = c.updatedAt
          break
        case 'WILTED':
          type = 'WILTED'
          description = `${c.name} has wilted`
          timestamp = c.updatedAt
          break
        case 'SEED':
          type = 'PLANTED'
          description = `Planted ${c.name}`
          timestamp = c.plantedAt
          break
        default:
          type = c.status
          description = `${c.name} is ${c.status.toLowerCase()}`
          timestamp = c.updatedAt
      }

      return { type, description, timestamp: timestamp.toISOString() }
    })

    // Merge, sort by timestamp descending, take top 5
    const mergedActivity = [...activityFromNotifications, ...activityFromCrops]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)

    return success({
      gardenCount,
      cropCount,
      matureCrops,
      wiltingCrops,
      harvestCount,
      totalCollections,
      totalSpecies,
      activeStreak: user?.currentStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
      groupCount,
      recentActivity: mergedActivity,
    })
  } catch (error) {
    return serverError(error)
  }
}
