import { NextRequest } from 'next/server'
import { success, notFound, serverError } from '@/lib/middleware/auth'
import { getDiseaseById } from '@/data/diseases'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const disease = getDiseaseById(id)
    if (!disease) {
      return notFound(`Disease '${id}' not found`)
    }
    return success(disease)
  } catch (error) {
    return serverError(error)
  }
}
