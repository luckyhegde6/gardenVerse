import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, requireAuth, success, badRequest, serverError, notFound } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  // If no type specified, return user gamification stats (mobile app endpoint)
  if (!type) {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    try {
      const [user, collections, masteries, totalSpecies] = await Promise.all([
        prisma.user.findUnique({
          where: { id: auth.payload.userId },
          select: { level: true, experience: true, greenCredits: true, ecoPoints: true },
        }),
        prisma.plantCollection.findMany({
          where: { userId: auth.payload.userId },
          include: { species: true },
        }),
        prisma.speciesMastery.findMany({
          where: { userId: auth.payload.userId },
          include: { species: true },
        }),
        prisma.plantSpecies.count(),
      ])

      if (!user) return notFound('User not found')

      return success({
        level: user.level,
        experience: user.experience,
        xpForNextLevel: user.level * 100,
        greenCredits: user.greenCredits,
        ecoPoints: user.ecoPoints,
        collections: {
          totalSpecies,
          discovered: collections.length,
          mastered: masteries.filter(m => m.perfectedAt).length,
          completionRate: totalSpecies > 0 ? Math.round((collections.length / totalSpecies) * 100) : 0,
        },
        masteries: masteries.map(m => ({
          id: m.id,
          speciesId: m.speciesId,
          speciesName: m.species.commonName,
          level: m.level,
          experience: m.experience,
          plantCount: m.plantCount,
          harvestCount: m.harvestCount,
          totalForNextLevel: m.level * 100,
          perfectedAt: m.perfectedAt,
        })),
      })
    } catch (error) {
      return serverError(error)
    }
  }

  const adminAuth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in adminAuth) return adminAuth.error

  switch (type) {
    case 'achievements':
      return getAchievements()
    case 'shop':
      return getShopItems(searchParams)
    default:
      return getAchievements()
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'achievements'

  try {
    const body = await request.json()

    switch (type) {
      case 'achievements':
        return createAchievement(body)
      case 'shop':
        return createShopItem(body)
      case 'buy':
        return buyShopItem(request, body)
      default:
        return badRequest('Invalid type')
    }
  } catch {
    return badRequest('Invalid JSON body')
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'shop'

  try {
    const body = await request.json()

    switch (type) {
      case 'shop':
        return updateShopItem(body)
      case 'achievements':
        return updateAchievement(body)
      default:
        return badRequest('Invalid type')
    }
  } catch {
    return badRequest('Invalid JSON body')
  }
}

async function getAchievements() {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: { category: 'asc' },
    })

    const userProgress = await prisma.userAchievement.groupBy({
      by: ['achievementId'],
      _count: { id: true },
      where: { completedAt: { not: null } },
    })

    const completionMap = new Map(userProgress.map(up => [up.achievementId, up._count.id]))

    return success(achievements.map(a => ({
      id: a.id,
      key: a.key,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      maxProgress: a.maxProgress,
      xpReward: a.xpReward,
      tokenReward: a.tokenReward,
      completedBy: completionMap.get(a.id) || 0,
    })))
  } catch (error) {
    return serverError(error)
  }
}

async function createAchievement(body: Record<string, unknown>) {
  try {
    if (!body.key || !body.name) {
      return badRequest('key and name are required')
    }

    const existing = await prisma.achievement.findUnique({
      where: { key: String(body.key) },
    })
    if (existing) {
      return badRequest('Achievement with this key already exists')
    }

    const achievement = await prisma.achievement.create({
      data: {
        key: String(body.key),
        name: String(body.name),
        description: body.description ? String(body.description) : null,
        icon: body.icon ? String(body.icon) : null,
        category: body.category ? String(body.category) : 'GENERAL',
        maxProgress: body.maxProgress ? Number(body.maxProgress) : 1,
        xpReward: body.xpReward ? Number(body.xpReward) : 0,
        tokenReward: body.tokenReward ? Number(body.tokenReward) : 0,
      },
    })

    return success(achievement, 201)
  } catch (error) {
    return serverError(error)
  }
}

async function getShopItems(searchParams: URLSearchParams) {
  try {
    const category = searchParams.get('category')
    const where: Record<string, unknown> = {}
    if (category) where.category = category

    const items = await prisma.shopItem.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return success(items)
  } catch (error) {
    return serverError(error)
  }
}

async function createShopItem(body: Record<string, unknown>) {
  try {
    if (!body.name || body.price === undefined) {
      return badRequest('name and price are required')
    }

    const item = await prisma.shopItem.create({
      data: {
        name: String(body.name),
        description: body.description ? String(body.description) : null,
        category: body.category ? String(body.category) : 'SEED',
        price: Number(body.price),
        currency: body.currency ? String(body.currency) : 'GREEN_CREDITS',
        icon: body.icon ? String(body.icon) : null,
        isLimited: body.isLimited ? Boolean(body.isLimited) : false,
        stock: body.stock ? Number(body.stock) : null,
        levelRequired: body.levelRequired ? Number(body.levelRequired) : 1,
        itemType: body.itemType ? String(body.itemType) : 'CONSUMABLE',
        effect: body.effect || undefined,
        isOnSale: body.isOnSale ? Boolean(body.isOnSale) : false,
        discountPrice: body.discountPrice ? Number(body.discountPrice) : null,
        saleEndsAt: body.saleEndsAt ? new Date(String(body.saleEndsAt)) : null,
      },
    })

    return success(item, 201)
  } catch (error) {
    return serverError(error)
  }
}

async function updateShopItem(body: Record<string, unknown>) {
  try {
    const { id, ...data } = body

    if (!id) {
      return badRequest('id is required for update')
    }

    const existing = await prisma.shopItem.findUnique({ where: { id: String(id) } })
    if (!existing) {
      return notFound('Shop item not found')
    }

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = String(data.name)
    if (data.description !== undefined) updateData.description = String(data.description)
    if (data.category !== undefined) updateData.category = String(data.category)
    if (data.price !== undefined) updateData.price = Number(data.price)
    if (data.currency !== undefined) updateData.currency = String(data.currency)
    if (data.icon !== undefined) updateData.icon = String(data.icon)
    if (data.isLimited !== undefined) updateData.isLimited = Boolean(data.isLimited)
    if (data.stock !== undefined) updateData.stock = Number(data.stock)
    if (data.levelRequired !== undefined) updateData.levelRequired = Number(data.levelRequired)
    if (data.itemType !== undefined) updateData.itemType = String(data.itemType)
    if (data.effect !== undefined) updateData.effect = data.effect
    if (data.isOnSale !== undefined) updateData.isOnSale = Boolean(data.isOnSale)
    if (data.discountPrice !== undefined) updateData.discountPrice = Number(data.discountPrice)
    if (data.saleEndsAt !== undefined) updateData.saleEndsAt = data.saleEndsAt ? new Date(String(data.saleEndsAt)) : null

    const updated = await prisma.shopItem.update({
      where: { id: String(id) },
      data: updateData,
    })

    return success(updated)
  } catch (error) {
    return serverError(error)
  }
}

async function updateAchievement(body: Record<string, unknown>) {
  try {
    const { id, ...data } = body

    if (!id) {
      return badRequest('id is required for update')
    }

    const existing = await prisma.achievement.findUnique({ where: { id: String(id) } })
    if (!existing) {
      return notFound('Achievement not found')
    }

    const updateData: Record<string, unknown> = {}
    if (data.key !== undefined) updateData.key = String(data.key)
    if (data.name !== undefined) updateData.name = String(data.name)
    if (data.description !== undefined) updateData.description = String(data.description)
    if (data.icon !== undefined) updateData.icon = String(data.icon)
    if (data.category !== undefined) updateData.category = String(data.category)
    if (data.maxProgress !== undefined) updateData.maxProgress = Number(data.maxProgress)
    if (data.xpReward !== undefined) updateData.xpReward = Number(data.xpReward)
    if (data.tokenReward !== undefined) updateData.tokenReward = Number(data.tokenReward)

    const updated = await prisma.achievement.update({
      where: { id: String(id) },
      data: updateData,
    })

    return success(updated)
  } catch (error) {
    return serverError(error)
  }
}

async function buyShopItem(request: NextRequest, body: Record<string, unknown>) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const userId = auth.payload.userId
    const itemId = body.itemId as string | undefined
    const quantity = body.quantity ? Number(body.quantity) : 1

    if (!itemId) {
      return badRequest('itemId is required')
    }

    if (quantity < 1) {
      return badRequest('quantity must be at least 1')
    }

    const [item, user] = await Promise.all([
      prisma.shopItem.findUnique({ where: { id: itemId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, greenCredits: true, level: true } }),
    ])

    if (!item) {
      return notFound('Shop item not found')
    }

    if (!user) {
      return notFound('User not found')
    }

    if (item.isLimited && item.stock !== null && item.stock < quantity) {
      return badRequest('Insufficient stock')
    }

    if (user.level < item.levelRequired) {
      return badRequest(`Level ${item.levelRequired} required to purchase this item`)
    }

    const totalPrice = item.price * quantity

    if (item.currency === 'GREEN_CREDITS') {
      if (user.greenCredits < totalPrice) {
        return badRequest('Insufficient green credits')
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const balanceBefore = user.greenCredits
      const balanceAfter = balanceBefore - totalPrice

      if (item.isLimited && item.stock !== null) {
        await tx.shopItem.update({
          where: { id: itemId },
          data: { stock: { decrement: quantity } },
        })
      }

      await tx.user.update({
        where: { id: userId },
        data: { greenCredits: { decrement: totalPrice } },
      })

      await tx.tokenTransaction.create({
        data: {
          userId,
          type: 'GREEN_CREDITS',
          amount: -totalPrice,
          balanceBefore,
          balanceAfter,
          action: 'PURCHASE',
          referenceId: itemId,
          referenceType: 'shop_item',
          description: `Purchased ${item.name} x${quantity}`,
        },
      })

      return tx.userPurchase.create({
        data: {
          userId,
          itemId,
          quantity,
          totalPrice,
        },
      })
    })

    return success({ purchase: result, item: item.name, quantity, totalPrice }, 201)
  } catch (error) {
    return serverError(error)
  }
}
