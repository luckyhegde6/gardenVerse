import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError, paginated } from '@/lib/middleware/auth'

// ---------------------------------------------------------------------------
// GET /api/v1/fertilizers  —  list fertilizers from ShopItem + Fertilizer model
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
    // Fetch user for level filtering
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { level: true },
    })

    const userLevel = user?.level ?? 1

    // Fetch from both sources in parallel
    const [shopFertilizers, catalogFertilizers] = await Promise.all([
      prisma.shopItem.findMany({
        where: {
          category: 'FERTILIZER',
          levelRequired: { lte: userLevel },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.fertilizer.findMany({
        where: {
          isActive: true,
          levelRequired: { lte: userLevel },
        },
        orderBy: { name: 'asc' },
      }),
    ])

    // Fetch user's active fertilizers in any garden
    const activeInventory = await prisma.userInventory.findMany({
      where: {
        userId,
        item: { category: 'FERTILIZER' },
        isActive: true,
        gardenId: { not: null },
      },
      include: {
        garden: { select: { id: true, name: true } },
        item: { select: { id: true, name: true } },
      },
    })

    // Map shop fertilizers
    const now = new Date()
    const fromShop = shopFertilizers.map((sf) => {
      const onSale = sf.isOnSale && sf.saleEndsAt && new Date(sf.saleEndsAt) > now
      return {
        source: 'shop' as const,
        id: sf.id,
        name: sf.name,
        description: sf.description,
        price: sf.price,
        effectivePrice: onSale && sf.discountPrice != null ? sf.discountPrice : sf.price,
        currency: sf.currency,
        icon: sf.icon,
        effect: sf.effect,
        rarity: null,
        levelRequired: sf.levelRequired,
        onSale,
        stock: sf.stock,
        isLimited: sf.isLimited,
      }
    })

    // Map catalog fertilizers
    const fromCatalog = catalogFertilizers.map((cf) => ({
      source: 'catalog' as const,
      id: cf.id,
      name: cf.name,
      description: cf.description,
      price: cf.price,
      effectivePrice: cf.price,
      currency: cf.currency,
      icon: cf.icon,
      effect: cf.effect,
      rarity: cf.rarity,
      levelRequired: cf.levelRequired,
      onSale: false,
      stock: cf.stock,
      isLimited: cf.stock != null,
    }))

    // Merge and sort
    const merged = [...fromShop, ...fromCatalog].sort((a, b) =>
      a.name.localeCompare(b.name),
    )

    // Paginate the merged list
    const total = merged.length
    const paginatedItems = merged.slice(offset, offset + limit)

    return success({
      data: paginatedItems,
      activeFertilizers: activeInventory,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return serverError(error)
  }
}
