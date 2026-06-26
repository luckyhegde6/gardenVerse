import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireRole(_request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: { rewardsConfig: true },
    })

    if (!campaign) {
      return notFound('Campaign')
    }

    return success({ campaign })
  } catch (error) {
    return serverError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const existing = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return notFound('Campaign')
    }

    const body = await request.json()
    const {
      name,
      description,
      type,
      status,
      startDate,
      endDate,
      rewardType,
      rewardValue,
      maxParticipants,
      terms,
      discountPercent,
      minLevel,
      maxRedemptions,
      targetUserRole,
      targetGardenType,
      couponCode,
    } = body

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)
    if (rewardType !== undefined) updateData.rewardType = rewardType
    if (rewardValue !== undefined) updateData.rewardValue = rewardValue
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants
    if (terms !== undefined) updateData.terms = terms
    if (discountPercent !== undefined) updateData.discountPercent = discountPercent
    if (minLevel !== undefined) updateData.minLevel = minLevel
    if (maxRedemptions !== undefined) updateData.maxRedemptions = maxRedemptions
    if (targetUserRole !== undefined) updateData.targetUserRole = targetUserRole
    if (targetGardenType !== undefined) updateData.targetGardenType = targetGardenType
    if (couponCode !== undefined) updateData.couponCode = couponCode

    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: updateData,
      include: { rewardsConfig: true },
    })

    return success({ campaign })
  } catch (error) {
    return serverError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireRole(_request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return notFound('Campaign')
    }

    if (campaign.status === 'ACTIVE') {
      return badRequest('Cannot delete an active campaign. Set status to draft or ended first.')
    }

    await prisma.campaign.delete({
      where: { id: params.id },
    })

    return success({ deleted: true })
  } catch (error) {
    return serverError(error)
  }
}
