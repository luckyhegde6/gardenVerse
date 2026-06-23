import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, badRequest, serverError } from '@/lib/middleware/auth'

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || process.env.AI_SERVICE_URL || 'http://localhost:8000'

/**
 * POST /api/v1/ai/scan
 * Proxy plant image to FastAPI AI service for identification/health analysis.
 * Accepts multipart form data with an image file.
 * Falls back to storing the scan locally if AI service is unavailable.
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const latitude = formData.get('latitude') as string | null
    const longitude = formData.get('longitude') as string | null

    if (!imageFile) {
      return badRequest('Image file is required (form field: "image")')
    }

    // Build form data for AI service
    const aiFormData = new FormData()
    aiFormData.append('image', imageFile, imageFile.name)
    if (latitude) aiFormData.append('latitude', latitude)
    if (longitude) aiFormData.append('longitude', longitude)
    aiFormData.append('user_id', auth.payload.userId)

    let aiResult: Record<string, unknown> = {}
    let aiSuccess = false

    try {
      const aiResponse = await fetch(`${AI_SERVICE_URL}/api/v1/scan`, {
        method: 'POST',
        body: aiFormData,
        signal: AbortSignal.timeout(30_000), // 30s timeout
      })

      if (aiResponse.ok) {
        aiResult = await aiResponse.json()
        aiSuccess = true
      }
    } catch {
      // AI service unavailable — will store scan locally without AI results
    }

    // Store scan result in database
    const scan = await prisma.aiScan.create({
      data: {
        imageUrl: (aiResult.image_url as string) || `data:${imageFile.type};base64,`,
        plantName: (aiResult.plant_name as string) || null,
        species: (aiResult.species as string) || null,
        healthScore: aiResult.health_score !== undefined ? Number(aiResult.health_score) : null,
        diseases: aiResult.diseases ? JSON.parse(JSON.stringify(aiResult.diseases)) : undefined,
        recommendations: aiResult.recommendations ? JSON.parse(JSON.stringify(aiResult.recommendations)) : undefined,
        userId: auth.payload.userId,
      },
    })

    // Create notification for low health score
    if (scan.healthScore !== null && scan.healthScore < 70) {
      await prisma.notification.create({
        data: {
          userId: auth.payload.userId,
          type: 'DISEASE_WARNING',
          title: 'Potential Plant Issue Detected',
          body: `AI analysis of ${scan.plantName || 'your plant'} shows potential health issues (score: ${scan.healthScore}/100). Check recommendations.`,
          data: { scanId: scan.id },
        },
      }).catch(() => {})
    }

    // Award XP for scanning
    await prisma.user.update({
      where: { id: auth.payload.userId },
      data: { experience: { increment: 5 } },
    }).catch(() => {})

    const disclaimer = aiSuccess && aiResult.analysis_disclaimer
      ? String(aiResult.analysis_disclaimer)
      : !aiSuccess
        ? 'AI service was unavailable. Results will be processed when the service is restored.'
        : undefined

    return success({
      scan,
      aiResult: aiSuccess ? {
        ...aiResult,
        disclaimer,
      } : null,
      aiServiceAvailable: aiSuccess,
      uncertainty: aiResult.uncertainty ?? 'low',
      disclaimer,
      message: aiSuccess
        ? 'Plant scanned successfully'
        : 'Image saved. AI service temporarily unavailable — results will be processed when service is restored.',
    }, 201)
  } catch (error) {
    return serverError(error)
  }
}
