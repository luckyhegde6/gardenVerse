import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, notFound, badRequest, serverError } from '@/lib/middleware/auth'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

export async function GET(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isVerified: true,
        isOnboarded: true,
        region: true,
        geohash: true,
        createdAt: true,
      },
    })

    if (!user) {
      finishRequestLog(ctx, request, 404)
      return notFound('User not found')
    }

    finishRequestLog(ctx, request, 200)
    return success(user)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}

export async function PUT(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const body = await request.json()
    const { displayName, bio, region, phone } = body

    // Build update data — only include provided fields
    const updateData: Record<string, unknown> = {}
    if (displayName !== undefined) updateData.displayName = displayName
    if (bio !== undefined) updateData.bio = bio
    if (region !== undefined) updateData.region = region
    if (phone !== undefined) updateData.phone = phone

    if (Object.keys(updateData).length === 0) {
      finishRequestLog(ctx, request, 400)
      return badRequest('No fields to update')
    }

    const user = await prisma.user.update({
      where: { id: auth.payload.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isVerified: true,
        isOnboarded: true,
        region: true,
        geohash: true,
        createdAt: true,
      },
    })

    finishRequestLog(ctx, request, 200)
    return success(user)
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireAuth(request)
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    await prisma.user.update({
      where: { id: auth.payload.userId },
      data: { deletedAt: new Date() },
    })

    finishRequestLog(ctx, request, 204)
    return new Response(null, { status: 204 })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
