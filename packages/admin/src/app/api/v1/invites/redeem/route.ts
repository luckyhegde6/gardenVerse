import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { code } = body

    if (!code) return badRequest('Invite code is required')

    const invite = await prisma.invite.findUnique({
      where: { code },
      include: { createdBy: true },
    })

    if (!invite) return notFound('Invalid invite code')
    if (!invite.isActive) return badRequest('Invite is no longer active')
    if (invite.useCount >= invite.maxUses) return badRequest('Invite has reached max uses')

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { isActive: false },
      })
      return badRequest('Invite has expired')
    }

    if (invite.createdById === auth.payload.userId) {
      return badRequest('Cannot redeem your own invite')
    }

    const willBeExhausted = invite.useCount + 1 >= invite.maxUses

    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        useCount: { increment: 1 },
        redeemedById: auth.payload.userId,
        redeemedAt: new Date(),
        isActive: willBeExhausted ? false : true,
      },
    })

    await prisma.user.update({
      where: { id: invite.createdById },
      data: {
        experience: { increment: 50 },
        reputationTokens: { increment: 10 },
      },
    })

    return success({
      message: 'Invite redeemed successfully',
      invitedBy: invite.createdBy.username,
    })
  } catch (error) {
    return serverError(error)
  }
}
