import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, requireRole, success, badRequest, serverError, notFound, paginated } from '@/lib/middleware/auth'

function generateReferralCode(userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ---------------------------------------------------------------------------
// GET  - user's referral code + stats  |  admin list with pagination
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'

    // ---- Admin: list all referrals with pagination ----
    if (isAdmin) {
      const adminAuth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
      if ('error' in adminAuth) return adminAuth.error

      const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
      const skip = (page - 1) * limit

      const [referrals, total] = await Promise.all([
        prisma.referral.findMany({
          include: {
            referrer: { select: { id: true, username: true, email: true } },
            referee: { select: { id: true, username: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.referral.count(),
      ])

      return paginated(referrals, total, page, limit)
    }

    // ---- User: get own referral code + stats ----
    const userId = auth.payload.userId

    // Find or create referral code
    let referralCode = await prisma.referral.findFirst({
      where: { referrerId: userId, status: 'PENDING' },
    })

    if (!referralCode) {
      // Generate a unique code and create a new referral record
      let code = generateReferralCode(userId)
      let attempts = 0
      while (await prisma.referral.findUnique({ where: { code } })) {
        code = generateReferralCode(userId)
        if (++attempts > 10) {
          return serverError(new Error('Failed to generate unique referral code'))
        }
      }
      referralCode = await prisma.referral.create({
        data: { code, referrerId: userId },
      })
    }

    const [totalReferrals, pendingReferrals, completedReferrals] = await Promise.all([
      prisma.referral.count({ where: { referrerId: userId } }),
      prisma.referral.count({ where: { referrerId: userId, status: 'PENDING' } }),
      prisma.referral.count({ where: { referrerId: userId, status: 'COMPLETED' } }),
    ])

    return success({
      code: referralCode.code,
      stats: {
        total: totalReferrals,
        pending: pendingReferrals,
        completed: completedReferrals,
      },
    })
  } catch (error) {
    return serverError(error)
  }
}

// ---------------------------------------------------------------------------
// POST  - apply a referral code
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()

    if (!body.code || typeof body.code !== 'string') {
      return badRequest('code is required')
    }

    const code = (body.code as string).trim().toUpperCase()
    const userId = auth.payload.userId

    // Find the referral record
    const referral = await prisma.referral.findUnique({
      where: { code },
    })

    if (!referral) {
      return badRequest('Invalid referral code')
    }

    // Cannot refer yourself
    if (referral.referrerId === userId) {
      return badRequest('Cannot use your own referral code')
    }

    // Check if user already has been referred
    const existingReferee = await prisma.referral.findUnique({
      where: { refereeId: userId },
    })
    if (existingReferee) {
      return badRequest('You have already been referred')
    }

    // Check if referral already completed
    if (referral.status === 'COMPLETED' || referral.refereeId) {
      return badRequest('Referral code already used')
    }

    // Apply referral
    const updated = await prisma.referral.update({
      where: { code },
      data: {
        refereeId: userId,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        referrer: { select: { id: true, username: true } },
        referee: { select: { id: true, username: true } },
      },
    })

    return success(updated, 200)
  } catch (error) {
    return serverError(error)
  }
}
