import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/middleware/auth'
import { success, serverError } from '@/lib/middleware/auth'

const PRICING_TIERS = [100, 250, 500, 800, 1200, 1500]
const MAX_PLOTS = 10

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const userId = auth.payload.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { maxPlots: true, plotPurchaseCount: true, level: true },
    })
    if (!user) {
      return success({
        currentPlots: 0,
        maxPlots: MAX_PLOTS,
        nextPlotPrice: PRICING_TIERS[0],
        pricingTiers: PRICING_TIERS,
        canPurchase: false,
      })
    }

    const currentPlots = await prisma.garden.count({ where: { userId } })
    const canPurchase = currentPlots < user.maxPlots && currentPlots < MAX_PLOTS

    // Determine next plot price tier
    const tierIndex = Math.max(0, currentPlots - 1)
    const nextPlotPrice = tierIndex < PRICING_TIERS.length
      ? PRICING_TIERS[tierIndex]
      : PRICING_TIERS[PRICING_TIERS.length - 1]

    return success({
      currentPlots,
      maxPlots: Math.min(user.maxPlots, MAX_PLOTS),
      plotPurchaseCount: user.plotPurchaseCount,
      nextPlotPrice,
      pricingTiers: PRICING_TIERS,
      canPurchase,
      userLevel: user.level,
    })
  } catch (error) {
    return serverError(error)
  }
}
