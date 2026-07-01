import fs from 'fs'
import path from 'path'
import type { Prisma } from '@/lib/prisma/generated/client'
import { prisma } from '@/lib/prisma/client'

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export interface LogEntry {
  id?: string
  timestamp?: string
  level: LogLevel
  message: string
  source?: string
  traceId?: string
  context?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userId?: string
}

const LOG_DIR = path.join(process.cwd(), 'logs')

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

function logFilePath(date?: Date): string {
  const d = date || new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return path.join(LOG_DIR, `app-${y}-${m}-${day}.log`)
}

function formatLogLine(entry: LogEntry): string {
  return JSON.stringify({
    timestamp: entry.timestamp || new Date().toISOString(),
    level: entry.level,
    message: entry.message,
    source: entry.source || 'admin',
    traceId: entry.traceId || '',
    context: entry.context || '',
    metadata: entry.metadata || {},
    ipAddress: entry.ipAddress || '',
    userId: entry.userId || '',
  })
}

function parseLogLine(line: string): LogEntry | null {
  try {
    const parsed = JSON.parse(line)
    return {
      id: `${parsed.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: parsed.timestamp,
      level: parsed.level,
      message: parsed.message,
      source: parsed.source || 'admin',
      traceId: parsed.traceId,
      context: parsed.context,
      metadata: parsed.metadata,
      ipAddress: parsed.ipAddress,
      userId: parsed.userId,
    }
  } catch {
    return null
  }
}

async function writeToFile(entry: LogEntry): Promise<void> {
  ensureLogDir()
  const filePath = logFilePath()
  const line = formatLogLine(entry) + '\n'
  try {
    await fs.promises.appendFile(filePath, line, 'utf-8')
  } catch {
    // silent — can't log a log failure
  }
}

async function writeToDb(entry: LogEntry): Promise<void> {
  try {
    await prisma.appLog.create({
      data: {
        level: entry.level,
        message: entry.message,
        context: entry.context || entry.source || null,
        metadata: entry.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: entry.ipAddress || null,
        traceId: entry.traceId || null,
        source: entry.source || 'admin',
        userId: entry.userId || null,
      },
    })
  } catch {
    // silent — db may be down
  }
}

async function cleanOldDbLogs(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await prisma.appLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })
  } catch {
    // silent
  }
}

export async function log(entry: LogEntry): Promise<void> {
  fileLog(entry)
  dbLog(entry)
}

export function fileLog(entry: LogEntry): void {
  writeToFile(entry)
}

export function dbLog(entry: LogEntry): void {
  writeToDb(entry)
  cleanOldDbLogs()
}

const logFn = {
  debug: (message: string, meta?: Partial<LogEntry>) => fileLog({ level: 'DEBUG', message, ...meta }),
  info: (message: string, meta?: Partial<LogEntry>) => fileLog({ level: 'INFO', message, ...meta }),
  warn: (message: string, meta?: Partial<LogEntry>) => fileLog({ level: 'WARN', message, ...meta }),
  error: (message: string, meta?: Partial<LogEntry>) => {
    fileLog({ level: 'ERROR', message, ...meta })
    dbLog({ level: 'ERROR', message, ...meta })
  },
}

export async function readLogs(opts: {
  level?: string
  source?: string
  search?: string
  limit?: number
  page?: number
  date?: string
}): Promise<{ logs: LogEntry[]; total: number; page: number; limit: number }> {
  const limit = opts.limit || 50
  const page = opts.page || 1
  const filePath = opts.date ? logFilePath(new Date(opts.date)) : logFilePath()
  const entries: LogEntry[] = []

  try {
    if (!fs.existsSync(filePath)) {
      return { logs: [], total: 0, page, limit }
    }
    const content = await fs.promises.readFile(filePath, 'utf-8')
    const lines = content.split('\n').filter(Boolean)

    for (const line of lines) {
      const entry = parseLogLine(line)
      if (!entry) continue

      if (opts.level && opts.level !== 'all' && entry.level !== opts.level.toUpperCase()) continue
      if (opts.source && opts.source !== 'all' && entry.source !== opts.source) continue
      if (opts.search) {
        const q = opts.search.toLowerCase()
        const inMsg = entry.message.toLowerCase().includes(q)
        const inCtx = (entry.context || '').toLowerCase().includes(q)
        const inMeta = JSON.stringify(entry.metadata || {}).toLowerCase().includes(q)
        if (!inMsg && !inCtx && !inMeta) continue
      }

      entries.push(entry)
    }
  } catch {
    return { logs: [], total: 0, page, limit }
  }

  entries.sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  const total = entries.length
  const offset = (page - 1) * limit
  const paginated = entries.slice(offset, offset + limit)

  return { logs: paginated, total, page, limit }
}

export async function clearLogs(date?: string): Promise<void> {
  if (date) {
    const filePath = logFilePath(new Date(date))
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath)
      }
    } catch {
      // silent
    }
  } else {
    ensureLogDir()
    const files = fs.readdirSync(LOG_DIR).filter(f => f.startsWith('app-'))
    for (const f of files) {
      try {
        await fs.promises.unlink(path.join(LOG_DIR, f))
      } catch {
        // silent
      }
    }
    try {
      await prisma.appLog.deleteMany({})
    } catch {
      // silent
    }
  }
}

export default logFn
