import { NextRequest } from 'next/server'
import { success, badRequest, serverError } from '@/lib/middleware/auth'
import { DISEASE_DATABASE, getDiseaseStats, searchDiseases, getDiseasesByType, getDiseasesByCrop } from '@/data/diseases'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const crop = searchParams.get('crop')
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')

    let results = [...DISEASE_DATABASE]

    if (q) {
      results = searchDiseases(q)
    } else if (crop) {
      results = getDiseasesByCrop(crop)
    } else if (type) {
      results = getDiseasesByType(type)
    }

    if (severity) {
      results = results.filter(d => d.severity === severity)
    }

    const stats = searchParams.has('stats') ? getDiseaseStats() : undefined

    return success({ diseases: results, total: results.length, stats })
  } catch (error) {
    return serverError(error)
  }
}
