import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, requireAuth, success, badRequest, serverError, notFound } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'achievements'

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
      },
    })

    return success(item, 201)
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
