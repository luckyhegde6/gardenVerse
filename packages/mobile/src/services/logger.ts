export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export interface LogEntry {
  level: LogLevel
  message: string
  source?: string
  context?: string
  metadata?: Record<string, unknown>
  timestamp?: string
  userId?: string
}

export interface Logger {
  debug(message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message'>>): void
  info(message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message'>>): void
  warn(message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message'>>): void
  error(message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message'>>): void
  getLogs(): LogEntry[]
  sendNow(): void
}

declare global {
  interface Window {
    __DEBUG_APP_LOGS?: LogEntry[]
    __DEBUG_API_LOGS?: { url: string; method: string; status: number; timestamp: string }[]
    __DEBUG_VISIBLE?: boolean
  }
}

const MAX_BUFFER = 200
const BATCH_INTERVAL = 500
const LOGS_API_URL = __DEV__
  ? 'http://localhost:3000/api/v1/logs'
  : 'https://gardenverse.vercel.app/api/v1/logs'

let buffer: LogEntry[] = []
let pendingBatch: LogEntry[] = []
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let isSending = false
let initialized = false

function addToBuffer(entry: LogEntry): void {
  buffer.push(entry)
  if (buffer.length > MAX_BUFFER) {
    buffer = buffer.slice(buffer.length - MAX_BUFFER)
  }
  try {
    (globalThis as any).__DEBUG_APP_LOGS = buffer
  } catch {
    // silent
  }
}

function enqueue(entry: LogEntry): void {
  pendingBatch.push(entry)
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(flushBatch, BATCH_INTERVAL)
}

async function flushBatch(): Promise<void> {
  if (pendingBatch.length === 0 || isSending) return
  isSending = true
  const batch = pendingBatch.slice()
  pendingBatch = []
  try {
    await fetch(LOGS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch.map(e => ({
        level: e.level,
        message: e.message,
        source: e.source || 'mobile',
        context: e.context || undefined,
        metadata: e.metadata || undefined,
        userId: e.userId || undefined,
      }))),
    })
  } catch {
    // silently drop — avoid infinite logging loops
  } finally {
    isSending = false
  }
}

function formatArgs(args: unknown[]): string {
  return args.map((a) => {
    if (a instanceof Error) {
      let s = a.name + ': ' + a.message
      if (a.stack) s = s + '\n' + a.stack
      return s
    }
    if (typeof a === 'object' && a !== null) {
      try { return JSON.stringify(a) } catch { return String(a) }
    }
    return String(a)
  }).join(' ')
}

export function createLogger(): Logger {
  return {
    debug(message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message'>>) {
      const entry: LogEntry = {
        level: 'DEBUG',
        message,
        timestamp: new Date().toISOString(),
        source: 'mobile',
        ...meta,
      }
      addToBuffer(entry)
      enqueue(entry)
    },

    info(message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message'>>) {
      const entry: LogEntry = {
        level: 'INFO',
        message,
        timestamp: new Date().toISOString(),
        source: 'mobile',
        ...meta,
      }
      addToBuffer(entry)
      enqueue(entry)
    },

    warn(message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message'>>) {
      const entry: LogEntry = {
        level: 'WARN',
        message,
        timestamp: new Date().toISOString(),
        source: 'mobile',
        ...meta,
      }
      addToBuffer(entry)
      enqueue(entry)
    },

    error(message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message'>>) {
      const entry: LogEntry = {
        level: 'ERROR',
        message,
        timestamp: new Date().toISOString(),
        source: 'mobile',
        ...meta,
      }
      addToBuffer(entry)
      enqueue(entry)
    },

    getLogs(): LogEntry[] {
      return [...buffer]
    },

    sendNow(): void {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        debounceTimer = null
      }
      flushBatch()
    },
  }
}

export function initLogger(): void {
  if (initialized) return
  initialized = true

  if (!__DEV__) return

  const origConsole = { ...console }

  console.log = (...args: unknown[]) => {
    origConsole.log(...args)
    const message = formatArgs(args)
    logger.info(message, { source: 'console' })
  }

  console.warn = (...args: unknown[]) => {
    origConsole.warn(...args)
    const message = formatArgs(args)
    logger.warn(message, { source: 'console' })
  }

  console.error = (...args: unknown[]) => {
    origConsole.error(...args)
    const message = formatArgs(args)
    logger.error(message, { source: 'console' })
  }
}

export const logger: Logger = createLogger()

export default logger
