import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, serverError, paginated } from '@/lib/middleware/auth'

// ---------------------------------------------------------------------------
// GET /api/v1/tools  —  list tool shop items with owned status for user
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  const userId = auth.payload.userId
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
  const offset = (page - 1) * limit

  try {
    const where = { category: 'TOOL' }

    const [items, total] = await Promise.all([
      prisma.shopItem.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.shopItem.count({ where }),
    ])

    // Fetch user's owned tool IDs
    const ownedItems = await prisma.userInventory.findMany({
      where: {
        userId,
        itemId: { in: items.map((i) => i.id) },
      },
      select: { itemId: true },
    })

    const ownedItemIds = new Set(ownedItems.map((o) => o.itemId))

    // Enrich each item with owned flag
    const enriched = items.map((item) => ({
      ...item,
      owned: ownedItemIds.has(item.id),
    }))

    return paginated(enriched, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}
