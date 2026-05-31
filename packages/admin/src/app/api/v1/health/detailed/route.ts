import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { success, serverError } from '@/lib/middleware/auth'

export async function GET(_request: NextRequest) {
  try {
    let dbStatus = 'healthy'
    let dbDetails: Record<string, unknown> = {}

    try {
      await prisma.$queryRaw`SELECT 1`
      const dbVersion: unknown = await prisma.$queryRaw`SELECT version()`
      const versionResult = dbVersion as Array<{ version: string }>
      dbDetails = { version: versionResult[0]?.version || 'unknown' }
    } catch {
      dbStatus = 'unhealthy'
      dbDetails = { error: 'Cannot connect' }
    }

    const services = {
      database: dbStatus,
      api: 'healthy',
    }

    const overallStatus = dbStatus === 'healthy' ? 'healthy' : 'degraded'
    const uptime = Math.floor(process.uptime())

    return success({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: `${uptime}s`,
      services,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      details: {
        database: dbDetails,
        memory: process.memoryUsage(),
        pid: process.pid,
      },
    })
  } catch (error) {
    return serverError(error)
  }
}
