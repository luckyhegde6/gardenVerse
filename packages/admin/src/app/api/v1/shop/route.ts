import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, serverError, paginated } from '@/lib/middleware/auth'
import type { Prisma } from '@/lib/prisma/generated/client'

// ---------------------------------------------------------------------------
// GET /api/v1/shop  —  list shop items (optionally filtered by category)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  const userId = auth.payload.userId
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
  const offset = (page - 1) * limit

  try {
    // Fetch user level for filtering items
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { level: true },
    })

    if (!user) {
      return paginated([], 0, page, limit)
    }

    const where: Prisma.ShopItemWhereInput = {
      levelRequired: { lte: user.level },
    }

    if (category && category !== 'all') {
      where.category = category
    }

    const [items, total] = await Promise.all([
      prisma.shopItem.findMany({
        where,
        orderBy: [{ levelRequired: 'asc' }, { name: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.shopItem.count({ where }),
    ])

    // Attach sale info and current price for each item
    const now = new Date()
    const enriched = items.map((item) => {
      const onSale = item.isOnSale && item.saleEndsAt && new Date(item.saleEndsAt) > now
      return {
        ...item,
        effectivePrice: onSale && item.discountPrice != null ? item.discountPrice : item.price,
        onSale,
      }
    })

    return paginated(enriched, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}
