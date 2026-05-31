import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { CryptoUtil } from '@/lib/crypto.util'
import { requireAuth, success, badRequest, notFound, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'

    const where = all ? {} : { createdById: auth.payload.userId }

    const invites = await prisma.invite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, username: true } },
        redeemedBy: { select: { id: true, username: true, avatarUrl: true } },
      },
    })

    return success(invites)
  } catch (error) {
    return serverError(error)
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const code = CryptoUtil.generateInviteCode()

    let expiresAt: Date | undefined
    if (body.expiresIn) {
      expiresAt = new Date()
      const match = (body.expiresIn as string).match(/^(\d+)([dh])$/)
      if (match) {
        const num = parseInt(match[1])
        if (match[2] === 'd') expiresAt.setDate(expiresAt.getDate() + num)
        if (match[2] === 'h') expiresAt.setHours(expiresAt.getHours() + num)
      }
    }

    const invite = await prisma.invite.create({
      data: {
        code,
        maxUses: body.maxUses || 1,
        createdById: auth.payload.userId,
        expiresAt,
      },
    })

    await prisma.user.update({
      where: { id: auth.payload.userId },
      data: { inviteCount: { increment: 1 } },
    })

    return success(invite, 201)
  } catch (error) {
    return serverError(error)
  }
}
