import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, requireRole } from '@/lib/middleware/auth'
import { success, badRequest, serverError } from '@/lib/middleware/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuid } from 'uuid'

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return badRequest('No file provided')
    }

    if (file.size > MAX_SIZE) {
      return badRequest(`File exceeds max size of ${MAX_SIZE / 1024 / 1024}MB`)
    }

    if (!ALLOWED_MIMES.includes(file.type)) {
      return badRequest(`File type ${file.type} not allowed`)
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${uuid()}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'images')

    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(join(uploadDir, filename), buffer)

    const url = `/uploads/images/${filename}`

    return success({ url, filename, size: file.size })
  } catch (error) {
    return serverError(error)
  }
}
