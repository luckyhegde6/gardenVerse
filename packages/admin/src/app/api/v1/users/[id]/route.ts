import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        phone: true,
        role: true,
        isVerified: true,
        isOnboarded: true,
        isBlocked: true,
        blockedReason: true,
        region: true,
        geohash: true,
        level: true,
        experience: true,
        greenCredits: true,
        ecoPoints: true,
        reputationTokens: true,
        sustainabilityScore: true,
        trustScore: true,
        marketplaceReliability: true,
        communityStanding: true,
        currentStreak: true,
        longestStreak: true,
        inviteCount: true,
        lastActiveAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        _count: {
          select: {
            crops: true,
            listings: true,
            devices: true,
            aiScans: true,
            notifications: true,
          },
        },
      },
    })

    if (!user) {
      return notFound('User not found')
    }

    return success(user)
  } catch (error) {
    return serverError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const {
      displayName,
      bio,
      phone,
      region,
      role,
      isVerified,
      isBlocked,
      blockedReason,
      isOnboarded,
    } = body as Record<string, unknown>

    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!existingUser) {
      return notFound('User not found')
    }

    const data: Record<string, unknown> = {}

    if (displayName !== undefined) data.displayName = displayName
    if (bio !== undefined) data.bio = bio
    if (phone !== undefined) data.phone = phone
    if (region !== undefined) data.region = region
    if (isVerified !== undefined) data.isVerified = isVerified
    if (isOnboarded !== undefined) data.isOnboarded = isOnboarded

    if (isBlocked !== undefined) {
      data.isBlocked = isBlocked
      data.blockedAt = isBlocked ? new Date() : null
      if (!isBlocked) {
        data.blockedReason = null
      }
    }

    if (blockedReason !== undefined && isBlocked !== false) {
      data.blockedReason = blockedReason
    }

    if (role !== undefined) {
      const roleMap: Record<string, string> = {
        'user': 'USER',
        'moderator': 'MODERATOR',
        'regional_moderator': 'REGIONAL_MODERATOR',
        'admin': 'ADMIN',
        'super_admin': 'SUPER_ADMIN',
      }
      const normalizedRole = roleMap[String(role).toLowerCase()] || String(role).toUpperCase()
      const validRoles = ['USER', 'MODERATOR', 'REGIONAL_MODERATOR', 'ADMIN', 'SUPER_ADMIN']
      if (!validRoles.includes(normalizedRole)) {
        return badRequest(`Invalid role. Must be one of: ${validRoles.map(r => r.toLowerCase()).join(', ')}`)
      }
      data.role = normalizedRole
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: data as any,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isVerified: true,
        isBlocked: true,
        blockedReason: true,
        isOnboarded: true,
        region: true,
        updatedAt: true,
      },
    })

    return success(user)
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true },
    })

    if (!existingUser) {
      return notFound('User not found')
    }

    if (existingUser.role === 'SUPER_ADMIN') {
      return badRequest('Cannot delete a super admin user')
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return success({ message: 'User deleted successfully' })
  } catch (error) {
    return serverError(error)
  }
}
