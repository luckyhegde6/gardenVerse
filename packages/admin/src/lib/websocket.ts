/**
 * WebSocket / Server-Sent Events helper.
 *
 * In the NestJS backend, Socket.IO with Redis adapter was used for realtime
 * communication. In this serverless environment, we use Server-Sent Events
 * (SSE) for one-way server-to-client push and document that persistent
 * connections (Socket.IO) should run on a separate worker for production.
 *
 * ── Production recommendation ──────────────────────────────────────────
 * Vercel serverless functions cannot maintain persistent TCP connections.
 * For Socket.IO in production:
 *   1. Deploy a separate Node.js worker on Railway / Fly.io
 *   2. Run Socket.IO + Redis adapter on that worker
 *   3. Use Upstash Redis for the pub/sub backend
 *   4. Connect from the Next.js app via fetch to the worker's HTTP API
 * ────────────────────────────────────────────────────────────────────────
 */

import logFn from '@/lib/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SseMessage {
  event?: string
  data: unknown
  id?: string
  retry?: number
}

export type BroadcastListener = (message: SseMessage) => void

// ---------------------------------------------------------------------------
// SSE stream helper
// ---------------------------------------------------------------------------

/**
 * Creates a ReadableStream that emits SSE-formatted messages.
 * Use this in Next.js API routes to establish an SSE connection.
 *
 * Example usage in a route.ts:
 * ```
 * export async function GET(req: NextRequest) {
 *   const { stream, send } = createSSEStream()
 *   // Start sending events:
 *   send({ event: 'connected', data: { message: 'hello' } })
 *   // Store `send` somewhere to push events later
 *   return stream
 * }
 * ```
 */
export function createSSEStream(): {
  stream: Response
  send: (msg: SseMessage) => void
  close: () => void
} {
  let controller: ReadableStreamDefaultController | null = null
  let closed = false

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl
      // Send initial comment to establish connection
      controller.enqueue(`:ok\n\n`)

      // Keep-alive every 30s
      const keepAlive = setInterval(() => {
        if (!closed) {
          try {
            controller!.enqueue(`:keepalive\n\n`)
          } catch {
            clearInterval(keepAlive)
          }
        } else {
          clearInterval(keepAlive)
        }
      }, 30_000)
    },
    cancel() {
      closed = true
      controller = null
      logFn.info('SSE stream cancelled by client')
    },
  })

  const response = new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })

  function send(message: SseMessage): void {
    if (closed || !controller) {
      logFn.warn('SSE: cannot send — stream closed', {
        metadata: { event: message.event },
      })
      return
    }

    try {
      let payload = ''
      if (message.event) payload += `event: ${message.event}\n`
      if (message.id) payload += `id: ${message.id}\n`
      if (message.retry !== undefined) payload += `retry: ${message.retry}\n`
      payload += `data: ${JSON.stringify(message.data)}\n\n`

      controller.enqueue(payload)
    } catch (err) {
      logFn.error('SSE: failed to send message', {
        metadata: { error: (err as Error).message },
      })
    }
  }

  function close(): void {
    if (!closed && controller) {
      closed = true
      try {
        controller.close()
      } catch {
        // already closed
      }
    }
  }

  return { stream: response, send, close }
}

// ---------------------------------------------------------------------------
// In-process broadcast helper
// ---------------------------------------------------------------------------

const listeners = new Map<string, Set<BroadcastListener>>()

/**
 * Subscribe to broadcast events by channel name.
 * Returns an unsubscribe function.
 */
export function subscribe(channel: string, listener: BroadcastListener): () => void {
  if (!listeners.has(channel)) {
    listeners.set(channel, new Set())
  }
  listeners.get(channel)!.add(listener)

  return () => {
    listeners.get(channel)?.delete(listener)
    if (listeners.get(channel)?.size === 0) {
      listeners.delete(channel)
    }
  }
}

/**
 * Broadcast a message to all listeners on a channel.
 */
export function broadcast(channel: string, message: SseMessage): void {
  const channelListeners = listeners.get(channel)
  if (!channelListeners || channelListeners.size === 0) return

  channelListeners.forEach((listener) => {
    try {
      listener(message)
    } catch (err) {
      logFn.error(`Broadcast error on channel "${channel}"`, {
        metadata: { error: (err as Error).message },
      })
    }
  })
}

/**
 * Remove all listeners from a channel.
 */
export function clearChannel(channel: string): void {
  listeners.delete(channel)
}

/**
 * Remove all listeners across all channels.
 */
export function clearAllChannels(): void {
  listeners.clear()
}

// ---------------------------------------------------------------------------
// Event type constants (shared with agent system)
// ---------------------------------------------------------------------------

export const SSE_EVENTS = {
  GARDEN_UPDATE: 'garden.update',
  CROP_UPDATE: 'crop.update',
  WEATHER_UPDATE: 'weather.update',
  WEATHER_ALERT: 'weather.alert',
  XP_UPDATE: 'xp.update',
  LEVEL_UP: 'level.up',
  MARKETPLACE_UPDATE: 'marketplace.update',
  NOTIFICATION: 'notification',
} as const
