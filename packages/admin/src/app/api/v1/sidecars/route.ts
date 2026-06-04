import { NextRequest } from 'next/server'
import { requireRole, success } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) return auth.error

  return success([
    { id: '1', name: 'Auth Service', description: 'JWT authentication & session management', status: 'online', uptime: '72h' },
    { id: '2', name: 'AI Vision', description: 'Plant disease detection & analysis', status: 'online', uptime: '48h' },
    { id: '3', name: 'MQTT Bridge', description: 'IoT device message broker', status: 'degraded', uptime: '12h' },
    { id: '4', name: 'Blockchain Indexer', description: 'Smart contract event sync', status: 'offline', uptime: '0h' },
  ])
}
