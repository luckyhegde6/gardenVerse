import { NextRequest } from 'next/server'
import { requireAuth, requireRole } from '@/lib/middleware/auth'
import { success, notFound, serverError } from '@/lib/middleware/auth'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    const searchParams = new URL(request.url).searchParams
    const url = searchParams.get('url')

    if (!url) {
      return notFound('File URL not provided')
    }

    const filePath = join(process.cwd(), 'public', url.replace('/uploads/', 'uploads/'))

    if (existsSync(filePath)) {
      await unlink(filePath)
      return success({ message: 'File deleted successfully' })
    }

    return notFound('File not found')
  } catch (error) {
    return serverError(error)
  }
}
