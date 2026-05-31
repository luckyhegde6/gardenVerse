import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError, paginated } from '@/lib/middleware/auth'
import type { Prisma, ListingStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status') || 'ACTIVE'
  const search = searchParams.get('search')
  const location = searchParams.get('location')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
  const offset = (page - 1) * limit

  try {
    const where: Prisma.MarketplaceListingWhereInput = {}

    if (status && status !== 'ALL') {
      where.status = status as ListingStatus
    }

    if (category) {
      where.category = category
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    const [items, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        include: {
          seller: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, marketplaceReliability: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.marketplaceListing.count({ where }),
    ])

    return paginated(items, total, page, limit)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { title, description, category, price, currency, quantity, location, isLocal } = body

    if (!title || !category || price === undefined) {
      return badRequest('title, category, and price are required')
    }

    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      return badRequest('price must be a valid non-negative number')
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        title,
        description: description || null,
        category,
        price: priceNum,
        currency: currency || 'GREEN_CREDITS',
        quantity: quantity ? parseInt(quantity) : 1,
        location: location || null,
        isLocal: isLocal === true,
        sellerId: auth.payload.userId,
      },
      include: {
        seller: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, marketplaceReliability: true },
        },
      },
    })

    return success(listing, 201)
  } catch (error) {
    return serverError(error)
  }
}
