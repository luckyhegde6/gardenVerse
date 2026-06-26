import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'
import type { Prisma } from '@prisma/client'

// ---------------------------------------------------------------------------
// POST /api/v1/shop/buy  —  purchase a shop item
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  const userId = auth.payload.userId

  try {
    const body = await request.json()
    const { itemId, quantity = 1, couponCode, gardenId } = body

    if (!itemId) {
      return badRequest('itemId is required')
    }

    const qty = Math.max(1, Math.floor(Number(quantity)))

    // Validate quantity
    if (qty > 999) {
      return badRequest('quantity must be at most 999')
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch item and user in parallel
      const [item, user] = await Promise.all([
        tx.shopItem.findUnique({ where: { id: itemId } }),
        tx.user.findUnique({ where: { id: userId } }),
      ])

      if (!item) {
        throw new Error('ITEM_NOT_FOUND')
      }

      if (!user) {
        throw new Error('USER_NOT_FOUND')
      }

      // 2. Level requirement
      if (user.level < item.levelRequired) {
        throw new Error('LEVEL_REQUIREMENT')
      }

      // 3. Stock check for limited items
      if (item.isLimited && item.stock != null) {
        if (item.stock < qty) {
          throw new Error('INSUFFICIENT_STOCK')
        }
      }

      // 4. Price calculation
      const now = new Date()
      const onSale =
        item.isOnSale && item.saleEndsAt && new Date(item.saleEndsAt) > now
      const unitPrice = onSale && item.discountPrice != null ? item.discountPrice : item.price
      let totalPrice = unitPrice * qty

      // 5. Coupon discount
      let coupon: Prisma.CouponGetPayload<Record<string, never>> | null = null
      if (couponCode) {
        coupon = await tx.coupon.findUnique({ where: { code: couponCode } })
        if (!coupon) {
          throw new Error('COUPON_NOT_FOUND')
        }
        if (!coupon.isActive) {
          throw new Error('COUPON_INACTIVE')
        }
        if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
          throw new Error('COUPON_EXPIRED')
        }
        if (coupon.maxRedemptions != null && coupon.usedCount >= coupon.maxRedemptions) {
          throw new Error('COUPON_EXHAUSTED')
        }
        if (user.level < coupon.minLevel) {
          throw new Error('COUPON_LEVEL_REQUIREMENT')
        }
        if (totalPrice < coupon.minPurchase) {
          throw new Error('COUPON_MIN_PURCHASE')
        }
        if (coupon.appliesTo && coupon.appliesTo !== item.category) {
          throw new Error('COUPON_APPLIES_TO')
        }

        if (coupon.discountType === 'PERCENTAGE') {
          const discount = (totalPrice * coupon.discountValue) / 100
          totalPrice = Math.max(0, totalPrice - discount)
        } else {
          // FIXED
          totalPrice = Math.max(0, totalPrice - coupon.discountValue)
        }
      }

      // Round to 2 decimal places
      totalPrice = Math.round(totalPrice * 100) / 100

      // 6. Balance check
      const currency = item.currency === 'ECO_POINTS' ? 'ecoPoints' : 'greenCredits'

      if (currency === 'greenCredits' && user.greenCredits < totalPrice) {
        throw new Error('INSUFFICIENT_GREEN_CREDITS')
      }
      if (currency === 'ecoPoints' && user.ecoPoints < totalPrice) {
        throw new Error('INSUFFICIENT_ECO_POINTS')
      }

      // 7. Deduct balance
      const balanceKey = currency === 'greenCredits' ? 'greenCredits' : 'ecoPoints'
      const balanceBefore = currency === 'greenCredits' ? user.greenCredits : user.ecoPoints

      await tx.user.update({
        where: { id: userId },
        data: { [balanceKey]: { decrement: totalPrice } },
      })

      // 8. Create UserPurchase record
      const purchase = await tx.userPurchase.create({
        data: {
          quantity: qty,
          totalPrice,
          userId,
          itemId: item.id,
        },
      })

      // 9. Create TokenTransaction record
      await tx.tokenTransaction.create({
        data: {
          type: currency === 'greenCredits' ? 'GREEN_CREDITS' : 'ECO_POINTS',
          amount: -totalPrice,
          balanceBefore,
          balanceAfter: balanceBefore - totalPrice,
          action: 'shop_purchase',
          referenceId: purchase.id,
          referenceType: 'shop_item',
          description: `Purchased ${qty}x ${item.name}${onSale ? ' (sale)' : ''}${coupon ? ' with coupon' : ''}`,
          metadata: {
            itemId: item.id,
            itemName: item.name,
            quantity: qty,
            unitPrice,
            couponCode: coupon?.code ?? null,
            gardenId: gardenId ?? null,
          },
          userId,
        },
      })

      // 10. Add to UserInventory
      await tx.userInventory.create({
        data: {
          isActive: true,
          purchasedAt: new Date(),
          userId,
          itemId: item.id,
          gardenId: gardenId || null,
        },
      })

      // 11. Decrement stock if limited
      if (item.isLimited && item.stock != null) {
        await tx.shopItem.update({
          where: { id: item.id },
          data: { stock: { decrement: qty } },
        })
      }

      // 12. Increment coupon usage if applied
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        })
      }

      return { purchase, itemName: item.name, totalPrice, onSale, couponUsed: !!coupon }
    })

    return success(
      {
        success: true,
        purchaseId: result.purchase.id,
        itemName: result.itemName,
        quantity: qty,
        totalPrice: result.totalPrice,
        onSale: result.onSale,
        couponUsed: result.couponUsed,
      },
      201,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'

    // Map known error messages to proper HTTP responses
    switch (message) {
      case 'ITEM_NOT_FOUND':
        return notFound('Shop item not found')
      case 'USER_NOT_FOUND':
        return notFound('User not found')
      case 'LEVEL_REQUIREMENT':
        return badRequest('You do not meet the level requirement for this item')
      case 'INSUFFICIENT_STOCK':
        return badRequest('This item is out of stock')
      case 'INSUFFICIENT_GREEN_CREDITS':
        return badRequest('Insufficient Green Credits')
      case 'INSUFFICIENT_ECO_POINTS':
        return badRequest('Insufficient Eco Points')
      case 'COUPON_NOT_FOUND':
        return notFound('Coupon not found')
      case 'COUPON_INACTIVE':
        return badRequest('This coupon is no longer active')
      case 'COUPON_EXPIRED':
        return badRequest('This coupon has expired')
      case 'COUPON_EXHAUSTED':
        return badRequest('This coupon has reached its maximum redemptions')
      case 'COUPON_LEVEL_REQUIREMENT':
        return badRequest('You do not meet the level requirement for this coupon')
      case 'COUPON_MIN_PURCHASE':
        return badRequest('The purchase amount does not meet the minimum for this coupon')
      case 'COUPON_APPLIES_TO':
        return badRequest('This coupon does not apply to this item category')
      default:
        return serverError(error)
    }
  }
}
