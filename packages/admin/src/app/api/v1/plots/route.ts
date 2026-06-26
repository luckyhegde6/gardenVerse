import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, badRequest, notFound, serverError, paginated } from '@/lib/middleware/auth'

const PRICING_TIERS = [100, 250, 500, 800, 1200, 1500]
const MAX_PLOTS = 10

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const userId = auth.payload.userId

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit
    const where = { userId }

    const [gardens, total] = await Promise.all([
      prisma.garden.findMany({
        where,
        include: {
          _count: { select: { crops: true } },
          soilChecks: { orderBy: { checkedAt: 'desc' }, take: 1 },
        },
        skip,
        take: limit,
        orderBy: { plotNumber: 'asc' },
      }),
      prisma.garden.count({ where }),
    ])

    const result = gardens.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      plotNumber: g.plotNumber,
      isPurchased: g.isPurchased,
      purchasedAt: g.purchasedAt,
      purchasePrice: g.purchasePrice,
      soilQuality: g.soilQuality,
      soilLastCheckedAt: g.soilLastCheckedAt,
      gridWidth: g.gridWidth,
      gridHeight: g.gridHeight,
      cropCount: g._count.crops,
      lastSoilCheck: g.soilChecks[0] || null,
      createdAt: g.createdAt,
    }))

    return paginated(result, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const userId = auth.payload.userId

    const body = await request.json().catch(() => ({}))
    const priceOverride: number | undefined = body.price

    // Fetch user with current garden count
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        greenCredits: true,
        maxPlots: true,
        plotPurchaseCount: true,
      },
    })
    if (!user) return notFound('User not found')

    const currentPlotCount = await prisma.garden.count({ where: { userId } })

    if (currentPlotCount >= user.maxPlots) {
      return badRequest(`You already have the maximum number of plots (${user.maxPlots})`)
    }

    if (currentPlotCount >= MAX_PLOTS) {
      return badRequest(`Maximum plot limit of ${MAX_PLOTS} reached`)
    }

    // Calculate price based on tier
    const tierIndex = Math.max(0, currentPlotCount - 1)
    const calculatedPrice = tierIndex < PRICING_TIERS.length
      ? PRICING_TIERS[tierIndex]
      : PRICING_TIERS[PRICING_TIERS.length - 1]

    const price = priceOverride ?? calculatedPrice

    // Validate price override (must be >= 0, admin-only override)
    if (priceOverride !== undefined) {
      if (priceOverride < 0) return badRequest('Price cannot be negative')
      const role = auth.payload.role.toUpperCase()
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && priceOverride !== calculatedPrice) {
        return badRequest('Only admins can override pricing')
      }
    }

    if (user.greenCredits < price) {
      return badRequest(`Insufficient green credits. Need ${price}, have ${user.greenCredits}`)
    }

    // Execute purchase in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct green credits and increment purchase count
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          greenCredits: { decrement: price },
          plotPurchaseCount: { increment: 1 },
        },
      })

      // Create the new garden (plot)
      const newGarden = await tx.garden.create({
        data: {
          name: `Plot #${currentPlotCount + 1}`,
          type: 'VIRTUAL',
          plotNumber: currentPlotCount + 1,
          isPurchased: true,
          purchasedAt: new Date(),
          purchasePrice: price,
          soilQuality: 50,
          gridWidth: 6,
          gridHeight: 6,
          userId,
        },
        include: { _count: { select: { crops: true } } },
      })

      // Record PlotPurchase
      const plotPurchase = await tx.plotPurchase.create({
        data: {
          price,
          tokenType: 'GREEN_CREDITS',
          plotNumber: newGarden.plotNumber,
          userId,
          gardenId: newGarden.id,
        },
      })

      // Record TokenTransaction
      const tokenTransaction = await tx.tokenTransaction.create({
        data: {
          type: 'GREEN_CREDITS',
          amount: -price,
          balanceBefore: user.greenCredits,
          balanceAfter: updatedUser.greenCredits,
          action: 'plot_purchase',
          referenceId: plotPurchase.id,
          referenceType: 'plot_purchase',
          description: `Purchased plot #${newGarden.plotNumber}`,
          userId,
        },
      })

      return { garden: newGarden, plotPurchase, tokenTransaction }
    })

    return success({
      garden: result.garden,
      plotPurchase: result.plotPurchase,
      transaction: result.tokenTransaction,
      remainingCredits: result.tokenTransaction.balanceAfter,
    }, 201)
  } catch (error) {
    return serverError(error)
  }
}
