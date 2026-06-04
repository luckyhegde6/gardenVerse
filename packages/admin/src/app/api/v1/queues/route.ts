import { NextRequest } from 'next/server'
import { requireRole, success } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  return success([
    { id: '1', name: 'crop-growth', pending: 12, active: 3, completed: 4520, failed: 8 },
    { id: '2', name: 'weather-sync', pending: 0, active: 1, completed: 12890, failed: 2 },
    { id: '3', name: 'notifications', pending: 45, active: 5, completed: 23400, failed: 15 },
    { id: '4', name: 'email', pending: 8, active: 2, completed: 8900, failed: 1 },
  ])
}
