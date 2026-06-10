import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { CropStatus } from '@prisma/client'
import { requireAuth, success, badRequest, serverError } from '@/lib/middleware/auth'

interface SyncPayload {
  crops?: unknown[]
  gardens?: unknown[]
  quests?: unknown[]
  collections?: unknown[]
  clientTimestamp: string
}

/**
 * POST /api/v1/mobile/sync
 * Receive game state from mobile app and merge with server data.
 * Server wins on conflict (server data takes precedence).
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json() as SyncPayload
    const userId = auth.payload.userId
    const now = new Date()

    const results: Record<string, { synced: number; conflicts: number }> = {}

    // Sync crops — server wins on conflict
    if (body.crops && Array.isArray(body.crops)) {
      let synced = 0
      let conflicts = 0
      for (const cropData of body.crops) {
        const crop = cropData as Record<string, unknown>
        if (!crop.id) continue
        const existing = await prisma.crop.findUnique({
          where: { id: crop.id as string },
        })
        if (existing) {
          const serverUpdated = existing.updatedAt
          const clientUpdated = crop.updatedAt ? new Date(crop.updatedAt as string) : new Date(0)
          if (clientUpdated > serverUpdated) {
            // Client has newer data — apply selective updates
            await prisma.crop.update({
              where: { id: crop.id as string },
              data: {
                growthStage: crop.growthStage !== undefined ? Number(crop.growthStage) : undefined,
                hydration: crop.hydration !== undefined ? Number(crop.hydration) : undefined,
                nutrientLevel: crop.nutrientLevel !== undefined ? Number(crop.nutrientLevel) : undefined,
                health: crop.health !== undefined ? Number(crop.health) : undefined,
                stressFactor: crop.stressFactor !== undefined ? Number(crop.stressFactor) : undefined,
                status: crop.status ? (typeof crop.status === 'string' ? (Object.values(CropStatus).includes(crop.status as CropStatus) ? crop.status as CropStatus : undefined) : undefined) : undefined,
              },
            })
            synced++
          } else {
            conflicts++
          }
        }
      }
      results.crops = { synced, conflicts }
    }

    // Sync garden settings
    if (body.gardens && Array.isArray(body.gardens)) {
      let synced = 0
      for (const gardenData of body.gardens) {
        const garden = gardenData as Record<string, unknown>
        if (!garden.id) continue
        const existing = await prisma.garden.findUnique({
          where: { id: garden.id as string },
        })
        if (existing) {
          await prisma.garden.update({
            where: { id: garden.id as string },
            data: {
              name: garden.name as string || undefined,
              theme: garden.theme as string || undefined,
              soilQuality: garden.soilQuality !== undefined ? Number(garden.soilQuality) : undefined,
              irrigationLevel: garden.irrigationLevel !== undefined ? Number(garden.irrigationLevel) : undefined,
              sunlightExposure: garden.sunlightExposure !== undefined ? Number(garden.sunlightExposure) : undefined,
              gridWidth: garden.gridWidth !== undefined ? Number(garden.gridWidth) : undefined,
              gridHeight: garden.gridHeight !== undefined ? Number(garden.gridHeight) : undefined,
              decorations: garden.decorations ? JSON.parse(JSON.stringify(garden.decorations)) : undefined,
            },
          })
          synced++
        }
      }
      results.gardens = { synced, conflicts: 0 }
    }

    // Sync quest progress
    if (body.quests && Array.isArray(body.quests)) {
      let synced = 0
      for (const questData of body.quests) {
        const quest = questData as Record<string, unknown>
        if (!quest.questId) continue
        const existing = await prisma.userQuest.findUnique({
          where: {
            userId_questId: {
              userId,
              questId: quest.questId as string,
            },
          },
        })
        if (existing) {
          const clientProgress = Number(quest.progress) || 0
          if (clientProgress > existing.progress) {
            await prisma.userQuest.update({
              where: { id: existing.id },
              data: {
                progress: clientProgress,
                claimedAt: quest.claimed ? now : existing.claimedAt,
                isCompleted: quest.isCompleted ? true : existing.isCompleted,
              },
            })
            synced++
          }
        } else {
          await prisma.userQuest.create({
            data: {
              userId,
              questId: quest.questId as string,
              progress: Number(quest.progress) || 0,
              claimedAt: quest.claimed ? now : null,
              isCompleted: quest.isCompleted ? true : false,
              questKey: (quest.questKey as string) || quest.questId as string,
            },
          })
          synced++
        }
      }
      results.quests = { synced, conflicts: 0 }
    }

    // Sync collection discoveries
    if (body.collections && Array.isArray(body.collections)) {
      let synced = 0
      for (const colData of body.collections) {
        const col = colData as Record<string, unknown>
        if (!col.speciesId) continue
        const existing = await prisma.plantCollection.findUnique({
          where: {
            userId_speciesId: {
              userId,
              speciesId: col.speciesId as string,
            },
          },
        })
        if (!existing) {
          await prisma.plantCollection.create({
            data: {
              userId,
              speciesId: col.speciesId as string,
              discoveredAt: new Date(),
              timesPlanted: Number(col.timesPlanted) || 0,
              timesHarvested: Number(col.timesHarvested) || 0,
            },
          })
          synced++
        }
      }
      results.collections = { synced, conflicts: 0 }
    }

    // Update user's last sync timestamp
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: now },
    }).catch(() => {})

    return success({
      syncedAt: now.toISOString(),
      results,
      message: 'Game data synced successfully',
    })
  } catch (error) {
    return serverError(error)
  }
}

/**
 * GET /api/v1/mobile/sync
 * Return server-side game state for the mobile app to merge.
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const sinceDate = since ? new Date(since) : new Date(0)

    const [gardens, crops, questProgress, collections, masteries, user] = await Promise.all([
      prisma.garden.findMany({
        where: { userId, updatedAt: { gt: sinceDate } },
      }),
      prisma.crop.findMany({
        where: { garden: { userId }, updatedAt: { gt: sinceDate } },
      }),
      prisma.userQuest.findMany({
        where: { userId, updatedAt: { gt: sinceDate } },
        include: { quest: true },
      }),
      prisma.plantCollection.findMany({
        where: { userId },
        include: { species: { select: { commonName: true, scientificName: true } } },
      }),
      prisma.speciesMastery.findMany({
        where: { userId },
        include: { species: { select: { commonName: true } } },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          level: true, experience: true, greenCredits: true, ecoPoints: true,
          sustainabilityScore: true, lastActiveAt: true,
        },
      }),
    ])

    return success({
      serverTimestamp: new Date().toISOString(),
      user, gardens, crops, questProgress, collections, masteries,
    })
  } catch (error) {
    return serverError(error)
  }
}
