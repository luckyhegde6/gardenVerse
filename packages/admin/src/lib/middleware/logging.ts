import { type NextRequest } from 'next/server'
import { fileLog, dbLog } from '@/lib/logger'
import type { LogLevel } from '@/lib/logger'

let traceCounter = 0

function generateTraceId(): string {
  traceCounter++
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 6)
  return `tr-${ts}-${rand}-${traceCounter}`
}

export interface LogContext {
  traceId: string
  startTime: number
}

export function startRequestLog(request: NextRequest): LogContext {
  const traceId = request.headers.get('x-trace-id') || generateTraceId()
  return { traceId, startTime: Date.now() }
}

export function finishRequestLog(ctx: LogContext, request: NextRequest, status: number): void {
  const duration = Date.now() - ctx.startTime
  const method = request.method
  const url = new URL(request.url)
  const pathname = url.pathname.replace('/api/v1', '') || '/'
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''

  const meta: Record<string, unknown> = { duration, status, method, path: pathname }

  const level: LogLevel = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO'
  const message = `${method} ${pathname} → ${status} (${duration}ms)`

  const entry = { level, message, source: 'api', traceId: ctx.traceId, metadata: meta, ipAddress: ip }

  fileLog(entry)
  if (level === 'ERROR') {
    dbLog(entry)
  }
}

export function logApiError(ctx: LogContext, request: NextRequest, error: unknown): void {
  const duration = Date.now() - ctx.startTime
  const method = request.method
  const url = new URL(request.url)
  const pathname = url.pathname.replace('/api/v1', '') || '/'
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
  const message = error instanceof Error ? error.message : String(error)

  const entry = {
    level: 'ERROR' as LogLevel,
    message: `${method} ${pathname} FAILED: ${message}`,
    source: 'api',
    traceId: ctx.traceId,
    metadata: { duration, method, path: pathname, error: message },
    ipAddress: ip,
  }

  fileLog(entry)
  dbLog(entry)
}
