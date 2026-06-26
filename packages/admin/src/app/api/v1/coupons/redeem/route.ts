import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

// ---------------------------------------------------------------------------
// POST /api/v1/coupons/redeem  —  validate and calculate coupon discount
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  const userId = auth.payload.userId

  try {
    const body = await request.json()
    const { code, purchaseAmount } = body

    if (!code) {
      return badRequest('code is required')
    }

    const amount = purchaseAmount !== undefined ? Number(purchaseAmount) : 0
    if (isNaN(amount) || amount < 0) {
      return badRequest('purchaseAmount must be a non-negative number')
    }

    // Find coupon by code
    const coupon = await prisma.coupon.findUnique({
      where: { code: String(code).trim().toUpperCase() },
    })

    if (!coupon) {
      return notFound('Coupon not found')
    }

    // Validate coupon
    const errors: string[] = []

    if (!coupon.isActive) {
      errors.push('This coupon is no longer active')
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      errors.push('This coupon has expired')
    }

    if (coupon.maxRedemptions != null && coupon.usedCount >= coupon.maxRedemptions) {
      errors.push('This coupon has reached its maximum redemptions')
    }

    // Fetch user for level check
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { level: true },
    })

    if (!user) {
      return notFound('User not found')
    }

    if (user.level < coupon.minLevel) {
      errors.push('You do not meet the level requirement for this coupon')
    }

    if (amount < coupon.minPurchase) {
      errors.push(
        `Minimum purchase amount of ${coupon.minPurchase} required for this coupon`,
      )
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return success({
        valid: false,
        errors,
        code: coupon.code,
      })
    }

    // Calculate discount
    let discountAmount = 0

    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (amount * coupon.discountValue) / 100
    } else {
      // FIXED
      discountAmount = coupon.discountValue
    }

    // Ensure discount doesn't exceed purchase amount
    discountAmount = Math.min(discountAmount, amount)

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100
    const finalAmount = Math.round((amount - discountAmount) * 100) / 100

    return success({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      originalAmount: amount,
      finalAmount,
      description: coupon.description,
    })
  } catch (error) {
    return serverError(error)
  }
}
