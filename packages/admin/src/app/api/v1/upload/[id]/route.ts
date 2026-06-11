import { NextRequest } from 'next/server'
import { requireAuth, requireRole } from '@/lib/middleware/auth'
import { success, notFound, forbidden, serverError } from '@/lib/middleware/auth'
import { unlink } from 'fs/promises'
import { join, resolve, basename } from 'path'
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

    // Resolve the base uploads directory
    const uploadsDir = resolve(join(process.cwd(), 'public', 'uploads'))

    // Use basename to strip any directory traversal components, then join with the safe base
    const safeFilename = basename(url)
    const filePath = resolve(join(uploadsDir, safeFilename))

    // Verify the resolved path is within the uploads directory (prevent path traversal)
    if (!filePath.startsWith(uploadsDir + '/') && filePath !== uploadsDir) {
      return forbidden('Invalid file path')
    }

    if (existsSync(filePath)) {
      await unlink(filePath)
      return success({ message: 'File deleted successfully' })
    }

    return notFound('File not found')
  } catch (error) {
    return serverError(error)
  }
}
