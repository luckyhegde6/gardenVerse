import { NextRequest } from 'next/server'
import { requireRole, success, serverError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma/client'
import { startRequestLog, finishRequestLog, logApiError } from '@/lib/middleware/logging'

interface EndpointMetric {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  requestCount: number
  avgResponseTime: number
  errorRate: number
  lastAccessed: string
}

function mockEndpointMetrics(): EndpointMetric[] {
  return [
    { path: '/api/v1/auth/login', method: 'POST', requestCount: 1247, avgResponseTime: 245, errorRate: 1.2, lastAccessed: '2 min ago' },
    { path: '/api/v1/gardens', method: 'GET', requestCount: 8932, avgResponseTime: 42, errorRate: 0.3, lastAccessed: '30s ago' },
    { path: '/api/v1/crops', method: 'GET', requestCount: 15420, avgResponseTime: 38, errorRate: 0.1, lastAccessed: '15s ago' },
    { path: '/api/v1/users', method: 'GET', requestCount: 3451, avgResponseTime: 56, errorRate: 0.4, lastAccessed: '1 min ago' },
    { path: '/api/v1/weather', method: 'GET', requestCount: 6782, avgResponseTime: 312, errorRate: 2.8, lastAccessed: '45s ago' },
    { path: '/api/v1/marketplace/listings', method: 'GET', requestCount: 2108, avgResponseTime: 67, errorRate: 0.6, lastAccessed: '3 min ago' },
    { path: '/api/v1/health', method: 'GET', requestCount: 44120, avgResponseTime: 12, errorRate: 0.0, lastAccessed: '5s ago' },
    { path: '/api/v1/analytics', method: 'GET', requestCount: 872, avgResponseTime: 890, errorRate: 4.5, lastAccessed: '10 min ago' },
    { path: '/api/v1/community/groups', method: 'GET', requestCount: 1560, avgResponseTime: 73, errorRate: 0.8, lastAccessed: '8 min ago' },
    { path: '/api/v1/ai/scan', method: 'POST', requestCount: 423, avgResponseTime: 1240, errorRate: 6.2, lastAccessed: '15 min ago' },
  ]
}

export async function GET(request: NextRequest) {
  const ctx = startRequestLog(request)
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
  if ('error' in auth) {
    finishRequestLog(ctx, request, 401)
    return auth.error
  }

  try {
    const recentLogs = await prisma.appLog.findMany({
      where: { context: { in: ['response_time', 'request'] } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    if (recentLogs.length === 0) {
      finishRequestLog(ctx, request, 200)
      return success({ metrics: mockEndpointMetrics(), source: 'mock' })
    }

    const endpointMap = new Map<string, { count: number; totalDuration: number; errors: number; lastAccess: Date }>()

    for (const log of recentLogs) {
      const meta = log.metadata as Record<string, unknown> | null
      if (!meta) continue
      const path = (meta.path as string) || log.context || 'unknown'
      const method = (meta.method as string) || 'GET'
      const key = `${method}:${path}`

      const entry = endpointMap.get(key) || { count: 0, totalDuration: 0, errors: 0, lastAccess: new Date(0) }
      entry.count++
      entry.totalDuration += (meta.duration as number) || 0
      if (log.level === 'ERROR') entry.errors++
      if (log.createdAt > entry.lastAccess) entry.lastAccess = log.createdAt
      endpointMap.set(key, entry)
    }

    const metrics: EndpointMetric[] = Array.from(endpointMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([key, data]) => {
        const [method, ...pathParts] = key.split(':')
        const path = pathParts.join(':')
        const minutesAgo = Math.round((Date.now() - data.lastAccess.getTime()) / 60000)
        const lastAccessed = minutesAgo < 1 ? 'just now' : minutesAgo < 60 ? `${minutesAgo} min ago` : `${Math.round(minutesAgo / 60)}h ago`
        return {
          path: `/api/v1${path}`,
          method: method as EndpointMetric['method'],
          requestCount: data.count,
          avgResponseTime: Math.round(data.totalDuration / data.count),
          errorRate: Math.round((data.errors / data.count) * 100 * 10) / 10,
          lastAccessed,
        }
      })

    finishRequestLog(ctx, request, 200)
    return success({ metrics: metrics.length > 0 ? metrics : mockEndpointMetrics(), source: metrics.length > 0 ? 'db' : 'mock' })
  } catch (error) {
    logApiError(ctx, request, error)
    return serverError(error)
  }
}
