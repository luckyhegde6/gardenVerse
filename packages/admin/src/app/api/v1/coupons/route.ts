import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import {
  requireRole,
  success,
  badRequest,
  serverError,
  paginated,
} from '@/lib/middleware/auth'

// ---------------------------------------------------------------------------
// GET /api/v1/coupons  —  list all coupons (admin only)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
  const offset = (page - 1) * limit

  // Optional filters
  const isActive = searchParams.get('isActive')
  const code = searchParams.get('code')

  try {
    const where: Record<string, unknown> = {}
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }
    if (code) {
      where.code = { contains: code, mode: 'insensitive' }
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.coupon.count({ where }),
    ])

    // Attach usage stats per coupon
    const enriched = coupons.map((c) => ({
      ...c,
      usageRate:
        c.maxRedemptions != null && c.maxRedemptions > 0
          ? Math.round((c.usedCount / c.maxRedemptions) * 100)
          : null,
      isExpired: c.expiresAt ? new Date(c.expiresAt) < new Date() : false,
    }))

    return paginated(enriched, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/coupons  —  create a coupon (admin only)
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxRedemptions,
      minLevel,
      appliesTo,
      isActive,
      expiresAt,
    } = body

    if (!code || discountValue === undefined || discountValue === null) {
      return badRequest('code and discountValue are required')
    }

    // Validate code format
    const codeStr = String(code).trim().toUpperCase()
    if (!/^[A-Z0-9_-]{3,30}$/.test(codeStr)) {
      return badRequest('code must be 3-30 characters (uppercase letters, numbers, underscores, hyphens)')
    }

    // Check for duplicate code
    const existing = await prisma.coupon.findUnique({ where: { code: codeStr } })
    if (existing) {
      return badRequest('A coupon with this code already exists')
    }

    const discountTypeStr = String(discountType || 'PERCENTAGE').toUpperCase()
    if (!['PERCENTAGE', 'FIXED'].includes(discountTypeStr)) {
      return badRequest('discountType must be PERCENTAGE or FIXED')
    }

    const discountVal = Number(discountValue)
    if (isNaN(discountVal) || discountVal < 0) {
      return badRequest('discountValue must be a non-negative number')
    }

    if (discountTypeStr === 'PERCENTAGE' && (discountVal < 0 || discountVal > 100)) {
      return badRequest('PERCENTAGE discountValue must be between 0 and 100')
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: codeStr,
        description: description || null,
        discountType: discountTypeStr,
        discountValue: discountVal,
        minPurchase: minPurchase ? Number(minPurchase) : 0,
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        minLevel: minLevel ? Number(minLevel) : 1,
        appliesTo: appliesTo || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return success(coupon, 201)
  } catch (error) {
    return serverError(error)
  }
}
