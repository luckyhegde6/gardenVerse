import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  score: number
  avatar: string
  level: number
}

const AVATAR_EMOJIS = ['🌱', '🌿', '🌻', '🌸', '🌺', '🍃', '🌳', '🌾', '🍀', '🌵']

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = Math.min(
      Math.max(Number(limitParam) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    )

    const users = await prisma.user.findMany({
      where: {
        isBlocked: false,
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        experience: true,
        avatarUrl: true,
        level: true,
      },
      orderBy: [
        { experience: 'desc' },
        { level: 'desc' },
        { username: 'asc' },
      ],
      take: limit,
    })

    const leaderboard: LeaderboardEntry[] = users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.displayName || user.username,
      score: user.experience,
      avatar: user.avatarUrl || AVATAR_EMOJIS[index % AVATAR_EMOJIS.length],
      level: user.level,
    }))

    return success({ data: leaderboard })
  } catch (error) {
    return serverError(error)
  }
}
