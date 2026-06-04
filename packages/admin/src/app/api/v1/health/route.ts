import { NextRequest } from 'next/server'
import { success, serverError } from '@/lib/middleware/auth'

export async function GET(_request: NextRequest) {
  try {
    return success({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
    })
  } catch (error) {
    return serverError(error)
  }
}
