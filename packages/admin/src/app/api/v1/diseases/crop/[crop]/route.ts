import { NextRequest } from 'next/server'
import { success, notFound, serverError } from '@/lib/middleware/auth'
import { getDiseasesByCrop, CROP_LIST } from '@/data/diseases'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ crop: string }> }
) {
  try {
    const { crop } = await params
    const diseases = getDiseasesByCrop(crop)

    if (!CROP_LIST.some(c => c.toLowerCase() === crop.toLowerCase())) {
      return notFound(`Crop '${crop}' not found`)
    }

    return success({ crop, diseases, total: diseases.length })
  } catch (error) {
    return serverError(error)
  }
}
