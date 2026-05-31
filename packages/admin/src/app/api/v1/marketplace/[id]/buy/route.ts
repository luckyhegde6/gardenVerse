import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
      include: { seller: true },
    })

    if (!listing) return notFound('Listing not found')
    if (listing.status !== 'ACTIVE') return badRequest('Listing is not available')
    if (listing.sellerId === auth.payload.userId) return badRequest('Cannot purchase your own listing')

    const body = await request.json().catch(() => ({}))
    const quantity = body.quantity ? parseInt(body.quantity) : 1
    if (quantity < 1 || quantity > listing.quantity) {
      return badRequest(`Invalid quantity. Available: ${listing.quantity}`)
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const buyer = await tx.user.findUnique({ where: { id: auth.payload.userId } })
      const seller = await tx.user.findUnique({ where: { id: listing.sellerId } })

      if (!buyer || !seller) throw new Error('User not found')

      const totalAmount = listing.price * quantity

      if (listing.currency === 'GREEN_CREDITS') {
        if ((buyer.greenCredits || 0) < totalAmount) {
          throw new Error('Insufficient green credits')
        }

        await tx.user.update({
          where: { id: buyer.id },
          data: { greenCredits: { decrement: totalAmount } },
        })

        await tx.user.update({
          where: { id: seller.id },
          data: { greenCredits: { increment: totalAmount } },
        })
      }

      await tx.marketplaceListing.update({
        where: { id: listing.id },
        data: {
          quantity: { decrement: quantity },
          status: listing.quantity - quantity <= 0 ? 'SOLD' : undefined,
        },
      })

      return tx.marketplaceTransaction.create({
        data: {
          listingId: listing.id,
          buyerId: auth.payload.userId,
          sellerId: listing.sellerId,
          amount: totalAmount,
          currency: listing.currency,
          status: 'COMPLETED',
        },
        include: {
          listing: { select: { id: true, title: true } },
          buyer: { select: { id: true, username: true } },
          seller: { select: { id: true, username: true } },
        },
      })
    })

    return success(transaction, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient green credits') {
      return badRequest('Insufficient green credits')
    }
    return serverError(error)
  }
}
