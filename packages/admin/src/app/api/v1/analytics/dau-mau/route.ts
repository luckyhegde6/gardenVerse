import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireRole, success, serverError } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  try {
    const now = new Date()
    const dauMau: Array<{ month: string; dau: number; mau: number }> = []

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const [dau, mau] = await Promise.all([
        prisma.user.count({
          where: {
            lastActiveAt: {
              gte: monthStart,
              lt: nextMonthStart,
            },
          },
        }),
        prisma.user.count({
          where: {
            lastActiveAt: { gte: monthStart },
          },
        }),
      ])

      const monthLabel = monthStart.toLocaleString('default', { month: 'short', year: 'numeric' })

      dauMau.push({ month: monthLabel, dau, mau })
    }

    return success({ dauMau })
  } catch (error) {
    return serverError(error)
  }
}
