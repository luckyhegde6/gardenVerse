import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, unauthorized, serverError } from '@/lib/middleware/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
      include: {
        seller: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, marketplaceReliability: true },
        },
        transactions: {
          select: { id: true, status: true, amount: true, createdAt: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!listing) return notFound('Listing not found')

    return success(listing)
  } catch (error) {
    return serverError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id: params.id } })
    if (!listing) return notFound('Listing not found')

    if (listing.sellerId !== auth.payload.userId) {
      return unauthorized('Not your listing')
    }

    if (listing.status !== 'ACTIVE') {
      return badRequest('Listing is not active')
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) {
      const priceNum = parseFloat(body.price)
      if (isNaN(priceNum) || priceNum < 0) return badRequest('Invalid price')
      updateData.price = priceNum
    }
    if (body.quantity !== undefined) {
      const qty = parseInt(body.quantity)
      if (qty < 1) return badRequest('Quantity must be at least 1')
      updateData.quantity = qty
    }
    if (body.category !== undefined) updateData.category = body.category
    if (body.location !== undefined) updateData.location = body.location
    if (body.isLocal !== undefined) updateData.isLocal = body.isLocal

    const updated = await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: updateData,
    })

    return success(updated)
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id: params.id } })
    if (!listing) return notFound('Listing not found')

    if (listing.sellerId !== auth.payload.userId) {
      return unauthorized('Not your listing')
    }

    const updated = await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    })

    return success(updated)
  } catch (error) {
    return serverError(error)
  }
}
