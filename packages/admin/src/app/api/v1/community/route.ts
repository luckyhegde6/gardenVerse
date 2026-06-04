import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, serverError } from '@/lib/middleware/auth'

export async function GET(_request: NextRequest) {
  try {
    const [groups, totalGroups] = await Promise.all([
      prisma.group.findMany({
        where: { isPrivate: false },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          _count: { select: { members: true } },
        },
      }),
      prisma.group.count(),
    ])

    const totalMembers = await prisma.groupMember.count()
    const totalMessages = await prisma.message.count()

    const recentlyActiveGroups = await prisma.group.findMany({
      where: { isPrivate: false },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, updatedAt: true, _count: { select: { members: true } } },
    })

    return success({
      groups,
      stats: {
        totalGroups,
        totalMembers,
        totalMessages,
        publicGroups: groups.length,
      },
      recentlyActiveGroups,
    })
  } catch (error) {
    return serverError(error)
  }
}
