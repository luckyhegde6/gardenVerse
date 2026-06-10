import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, requireRole, success, badRequest, serverError } from '@/lib/middleware/auth'

// ---------------------------------------------------------------------------
// GET  - list all themes  |  ?owned=true for user-purchased themes
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const ownedOnly = searchParams.get('owned') === 'true'
    const userId = auth.payload.userId

    if (ownedOnly) {
      // Find theme keys the user has purchased via UserPurchase -> ShopItem
      const purchases = await prisma.userPurchase.findMany({
        where: { userId },
        include: {
          item: { select: { id: true, name: true, category: true } },
        },
      })

      // Collect purchased item IDs to cross-reference with themes
      // Themes are purchased as ShopItems; we look up themes whose key matches
      // purchased shop item names or whose key appears in the item name.
      const purchasedItemIds = purchases.map(p => p.item.id)

      const themes = await prisma.gardenTheme.findMany({
        orderBy: { name: 'asc' },
      })

      // Mark themes as owned if the user has a purchase referencing them
      const themesWithOwnership = themes.map(theme => ({
        ...theme,
        isOwned: purchases.some(
          p => p.item.name.toLowerCase() === theme.key.toLowerCase() ||
               p.item.name.toLowerCase() === theme.name.toLowerCase()
        ),
      }))

      return success(themesWithOwnership)
    }

    // Default: return all themes
    const themes = await prisma.gardenTheme.findMany({
      orderBy: { name: 'asc' },
    })

    return success(themes)
  } catch (error) {
    return serverError(error)
  }
}

// ---------------------------------------------------------------------------
// POST  - create a theme (admin only)
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()

    if (!body.key || !body.name) {
      return badRequest('key and name are required')
    }

    const existing = await prisma.gardenTheme.findUnique({
      where: { key: String(body.key) },
    })
    if (existing) {
      return badRequest('Theme with this key already exists')
    }

    const theme = await prisma.gardenTheme.create({
      data: {
        key: String(body.key),
        name: String(body.name),
        description: body.description ? String(body.description) : null,
        icon: body.icon ? String(body.icon) : null,
        price: body.price !== undefined ? Number(body.price) : 0,
        currency: body.currency ? String(body.currency) : 'GREEN_CREDITS',
        isDefault: body.isDefault ? Boolean(body.isDefault) : false,
        soilColor: body.soilColor ? String(body.soilColor) : null,
        grassColor: body.grassColor ? String(body.grassColor) : null,
        decorStyle: body.decorStyle ? String(body.decorStyle) : null,
      },
    })

    return success(theme, 201)
  } catch (error) {
    return serverError(error)
  }
}

// ---------------------------------------------------------------------------
// PATCH  - update a theme by body.id (admin only)
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()

    if (!body.id) {
      return badRequest('id is required')
    }

    const existing = await prisma.gardenTheme.findUnique({
      where: { id: String(body.id) },
    })
    if (!existing) {
      return badRequest('Theme not found')
    }

    // If changing key, ensure uniqueness
    if (body.key && body.key !== existing.key) {
      const keyTaken = await prisma.gardenTheme.findUnique({
        where: { key: String(body.key) },
      })
      if (keyTaken) {
        return badRequest('Theme with this key already exists')
      }
    }

    const theme = await prisma.gardenTheme.update({
      where: { id: String(body.id) },
      data: {
        ...(body.key !== undefined && { key: String(body.key) }),
        ...(body.name !== undefined && { name: String(body.name) }),
        ...(body.description !== undefined && { description: body.description ? String(body.description) : null }),
        ...(body.icon !== undefined && { icon: body.icon ? String(body.icon) : null }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.currency !== undefined && { currency: String(body.currency) }),
        ...(body.isDefault !== undefined && { isDefault: Boolean(body.isDefault) }),
        ...(body.soilColor !== undefined && { soilColor: body.soilColor ? String(body.soilColor) : null }),
        ...(body.grassColor !== undefined && { grassColor: body.grassColor ? String(body.grassColor) : null }),
        ...(body.decorStyle !== undefined && { decorStyle: body.decorStyle ? String(body.decorStyle) : null }),
      },
    })

    return success(theme)
  } catch (error) {
    return serverError(error)
  }
}
