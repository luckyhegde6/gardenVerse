import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'

// ---------------------------------------------------------------------------
// GET  - get user's notification preferences (create defaults if not exist)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId

    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId },
    })

    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: { userId },
      })
    }

    return success(preferences)
  } catch (error) {
    return serverError(error)
  }
}

// ---------------------------------------------------------------------------
// PUT  - update notification preferences (upsert pattern)
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const userId = auth.payload.userId

    const updateData: Record<string, unknown> = {}

    // Boolean notification toggles
    const booleanFields = [
      'growthAlerts',
      'waterReminders',
      'weatherAlerts',
      'socialNotifications',
      'marketplaceUpdates',
      'achievementUnlocks',
      'streakReminders',
      'eventNotifications',
      'quietHoursEnabled',
    ] as const

    for (const field of booleanFields) {
      if (body[field] !== undefined) {
        updateData[field] = Boolean(body[field])
      }
    }

    // Quiet hours string fields
    if (body.quietHoursStart !== undefined) {
      updateData.quietHoursStart = body.quietHoursStart ? String(body.quietHoursStart) : null
    }
    if (body.quietHoursEnd !== undefined) {
      updateData.quietHoursEnd = body.quietHoursEnd ? String(body.quietHoursEnd) : null
    }

    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...Object.fromEntries(
          booleanFields.map(f => [f, body[f] !== undefined ? Boolean(body[f]) : f === 'quietHoursEnabled' ? false : true])
        ),
        ...(body.quietHoursStart !== undefined && { quietHoursStart: body.quietHoursStart ? String(body.quietHoursStart) : null }),
        ...(body.quietHoursEnd !== undefined && { quietHoursEnd: body.quietHoursEnd ? String(body.quietHoursEnd) : null }),
      },
    })

    return success(preferences)
  } catch (error) {
    return serverError(error)
  }
}
