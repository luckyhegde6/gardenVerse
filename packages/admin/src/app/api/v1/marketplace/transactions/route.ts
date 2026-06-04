import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const offset = (page - 1) * limit

    const [transactions, total] = await Promise.all([
      prisma.marketplaceTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          listing: { select: { title: true, category: true } },
          buyer: { select: { id: true, username: true } },
          seller: { select: { id: true, username: true } },
        },
      }),
      prisma.marketplaceTransaction.count(),
    ])

    const mapped = transactions.map(tx => ({
      id: tx.id,
      type: tx.listing?.category || 'Listing',
      item: tx.listing?.title || 'Unknown',
      seller: tx.seller?.username || 'unknown',
      buyer: tx.buyer?.username || 'unknown',
      amount: tx.amount,
      fee: 0,
      date: tx.createdAt.toISOString(),
    }))

    return success({ transactions: mapped, total, page, limit })
  } catch (error) {
    return serverError(error)
  }
}
