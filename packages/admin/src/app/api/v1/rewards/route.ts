import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, notFound, serverError, paginated } from '@/lib/middleware/auth'
import { sanitizeLike } from '@/lib/sanitize'
import type { Prisma } from '@prisma/client'

const VALID_TOKEN_TYPES = ['GREEN_CREDITS', 'ECO_POINTS', 'REPUTATION_TOKENS'] as const

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'users'

    if (type === 'transactions') {
      return getTransactions(searchParams)
    }

    return getUsersOverview(searchParams)
  } catch (error) {
    return serverError(error)
  }
}

async function getUsersOverview(searchParams: URLSearchParams) {
  const query = sanitizeLike(searchParams.get('search') || '')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit

  const where: Prisma.UserWhereInput = {}

  if (query) {
    where.OR = [
      { username: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { displayName: { contains: query, mode: 'insensitive' } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        level: true,
        experience: true,
        greenCredits: true,
        ecoPoints: true,
        _count: { select: { tokenTransactions: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return paginated(users, total, page, limit)
}

async function getTransactions(searchParams: URLSearchParams) {
  const userId = searchParams.get('userId') || ''
  const tokenType = searchParams.get('tokenType') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const offset = (page - 1) * limit

  const where: Prisma.TokenTransactionWhereInput = {}

  if (userId) {
    where.userId = userId
  }

  if (tokenType && (VALID_TOKEN_TYPES as readonly string[]).includes(tokenType)) {
    where.type = tokenType as 'GREEN_CREDITS' | 'ECO_POINTS' | 'REPUTATION_TOKENS'
  }

  const [transactions, total] = await Promise.all([
    prisma.tokenTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: { select: { id: true, username: true, displayName: true, email: true } },
      },
    }),
    prisma.tokenTransaction.count({ where }),
  ])

  return paginated(transactions, total, page, limit)
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { userId, type, amount, action, description } = body as Record<string, unknown>

    if (!userId || typeof userId !== 'string') {
      return badRequest('userId is required')
    }

    if (!type || !(VALID_TOKEN_TYPES as readonly string[]).includes(type as string)) {
      return badRequest('type must be GREEN_CREDITS, ECO_POINTS, or REPUTATION_TOKENS')
    }

    if (amount === undefined || amount === null || Number(amount) === 0) {
      return badRequest('amount must be a non-zero number')
    }

    if (!action || typeof action !== 'string') {
      return badRequest('action is required')
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, greenCredits: true, ecoPoints: true, reputationTokens: true },
    })

    if (!user) {
      return notFound('User not found')
    }

    const numericAmount = Number(amount)
    const tokenType = type as string
    const balanceField = tokenType === 'ECO_POINTS'
      ? 'ecoPoints'
      : tokenType === 'REPUTATION_TOKENS'
        ? 'reputationTokens'
        : 'greenCredits'

    const balanceBefore = user[balanceField as keyof typeof user] as number
    const balanceAfter = balanceBefore + numericAmount

    if (balanceAfter < 0) {
      return badRequest('Insufficient balance — adjustment would result in negative balance')
    }

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { [balanceField]: balanceAfter },
      })

      return tx.tokenTransaction.create({
        data: {
          userId,
          type: tokenType as 'GREEN_CREDITS' | 'ECO_POINTS' | 'REPUTATION_TOKENS',
          amount: numericAmount,
          balanceBefore,
          balanceAfter,
          action,
          description: description ? String(description) : null,
        },
      })
    })

    return success({
      transaction,
      user: { id: user.id, [balanceField]: balanceAfter },
    }, 201)
  } catch (error) {
    return serverError(error)
  }
}
