import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { Prisma } from '@/lib/prisma/generated/client'
import { requireRole, success, badRequest, serverError, paginated } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit
    const status = searchParams.get('status') || ''
    const contractType = searchParams.get('contractType') || ''

    const where: Prisma.BlockchainTransactionWhereInput = {}

    if (status) {
      where.status = status.toUpperCase()
    }

    if (contractType) {
      where.contractType = contractType
    }

    const [transactions, total] = await Promise.all([
      prisma.blockchainTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, username: true, displayName: true } },
        },
      }),
      prisma.blockchainTransaction.count({ where }),
    ])

    return paginated(transactions, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { userId, contractType, action, fromAddress, toAddress, amount, tokenId, txHash, status } = body as Record<string, unknown>

    if (!userId || !contractType || !action) {
      return badRequest('userId, contractType, and action are required')
    }

    const user = await prisma.user.findUnique({ where: { id: userId as string }, select: { id: true } })
    if (!user) {
      return badRequest('User not found')
    }

    const transaction = await prisma.blockchainTransaction.create({
      data: {
        userId: userId as string,
        contractType: contractType as string,
        action: action as string,
        fromAddress: fromAddress as string | undefined,
        toAddress: toAddress as string | undefined,
        amount: amount as string | undefined,
        tokenId: tokenId as string | undefined,
        txHash: txHash as string | undefined,
        status: (status as string) || 'PENDING',
      },
      include: {
        user: { select: { id: true, username: true, displayName: true } },
      },
    })

    return success(transaction, 201)
  } catch (error) {
    return serverError(error)
  }
}
