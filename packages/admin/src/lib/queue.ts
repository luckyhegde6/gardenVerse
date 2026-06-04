/**
 * In-process queue wrapper — replaces BullMQ for Vercel serverless.
 *
 * Jobs are processed immediately with Promise-based queueing.
 * No external dependency (Redis, BullMQ) required.
 *
 * Migration note:
 *   In the NestJS backend, BullMQ with Redis was used for agent communication
 *   and background jobs. In this serverless environment, we use direct
 *   in-process execution. For production with high throughput, deploy a
 *   separate worker process (e.g., Railway, Fly.io) running a real BullMQ
 *   instance connected to Upstash Redis.
 */

import logFn from '@/lib/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobStatus = 'pending' | 'active' | 'completed' | 'failed'

export interface Job<T = unknown> {
  id: string
  name: string
  data: T
  opts?: JobOptions
  status: JobStatus
  createdAt: Date
  processedAt?: Date
  finishedAt?: Date
  result?: unknown
  error?: string
  attempts: number
}

export interface JobOptions {
  delay?: number          // ms before execution
  attempts?: number       // max retry attempts (default 1)
  backoff?: number        // ms between retries (default 1000)
  removeOnComplete?: boolean
  removeOnFail?: boolean
}

export interface JobCounts {
  pending: number
  active: number
  completed: number
  failed: number
}

// ---------------------------------------------------------------------------
// Queue implementation
// ---------------------------------------------------------------------------

const queues = new Map<string, InProcessQueue>()

export function getQueue(name: string): InProcessQueue {
  let q = queues.get(name)
  if (!q) {
    q = new InProcessQueue(name)
    queues.set(name, q)
  }
  return q
}

export class InProcessQueue {
  readonly name: string

  private jobs: Job[] = []
  private processing = false
  private jobIdCounter = 0

  constructor(name: string) {
    this.name = name
  }

  /**
   * Add a job to the queue. Processing begins immediately (async).
   * Returns a promise that resolves with the job result when complete.
   */
  async add<T = unknown>(name: string, data: T, opts?: JobOptions): Promise<Job<T>> {
    const id = `${this.name}:${++this.jobIdCounter}:${Date.now()}`
    const job: Job<T> = {
      id,
      name,
      data,
      opts: {
        delay: 0,
        attempts: 1,
        backoff: 1000,
        removeOnComplete: false,
        removeOnFail: false,
        ...opts,
      },
      status: 'pending',
      createdAt: new Date(),
      attempts: 0,
    }

    this.jobs.push(job as Job)
    logFn.debug(`Queue "${this.name}": job "${name}" added (${id})`)

    // Process asynchronously
    this.processNext()

    return job
  }

  /**
   * Get current job counts by status.
   */
  getJobCounts(): JobCounts {
    const counts: JobCounts = { pending: 0, active: 0, completed: 0, failed: 0 }
    for (const job of this.jobs) {
      counts[job.status]++
    }
    return counts
  }

  /**
   * Get all jobs, optionally filtered by statuses.
   */
  getJobs(statuses?: JobStatus[]): Job[] {
    if (!statuses || statuses.length === 0) return [...this.jobs]
    return this.jobs.filter(j => statuses.includes(j.status))
  }

  /**
   * Remove all jobs from the queue.
   */
  obliterate(): void {
    this.jobs = []
    this.processing = false
    logFn.info(`Queue "${this.name}": obliterated`)
  }

  // -----------------------------------------------------------------------
  // Internal processing
  // -----------------------------------------------------------------------

  private async processNext(): Promise<void> {
    if (this.processing) return
    this.processing = true

    const pending = this.jobs.find(j => j.status === 'pending')
    if (!pending) {
      this.processing = false
      return
    }

    pending.status = 'active'
    pending.processedAt = new Date()

    try {
      const result = await this.executeJob(pending)
      pending.status = 'completed'
      pending.finishedAt = new Date()
      pending.result = result
      pending.error = undefined

      logFn.debug(`Queue "${this.name}": job "${pending.name}" completed`, {
        metadata: { jobId: pending.id, attempts: pending.attempts },
      })

      if (pending.opts?.removeOnComplete) {
        this.jobs = this.jobs.filter(j => j.id !== pending.id)
      }
    } catch (err) {
      pending.attempts++
      const maxAttempts = pending.opts?.attempts ?? 1

      if (pending.attempts < maxAttempts) {
        // Retry
        pending.status = 'pending'
        const delay = pending.opts?.backoff ?? 1000
        logFn.warn(
          `Queue "${this.name}": job "${pending.name}" failed, retrying (${pending.attempts}/${maxAttempts})`,
          { metadata: { jobId: pending.id, error: (err as Error).message } },
        )

        setTimeout(() => this.processNext(), delay)
        this.processing = false
        return
      }

      // Final failure
      pending.status = 'failed'
      pending.finishedAt = new Date()
      pending.error = (err as Error).message || String(err)

      logFn.error(`Queue "${this.name}": job "${pending.name}" failed after ${pending.attempts} attempts`, {
        metadata: { jobId: pending.id, error: pending.error },
      })

      if (pending.opts?.removeOnFail) {
        this.jobs = this.jobs.filter(j => j.id !== pending.id)
      }
    }

    this.processing = false
    // Process next pending job
    this.processNext()
  }

  private async executeJob(job: Job): Promise<unknown> {
    // If a job with this name has a registered handler, invoke it.
    // Otherwise, the job is a no-op — the caller should have already
    // performed the work and is just tracking completion via the queue.
    const handler = jobHandlers.get(job.name)
    if (handler) {
      return handler(job.data)
    }
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Job handler registry
// ---------------------------------------------------------------------------

type JobHandler = (data: unknown) => Promise<unknown>

const jobHandlers = new Map<string, JobHandler>()

/**
 * Register a handler function for a named job type.
 * When a job with that name is processed, the handler is invoked with the
 * job's data and the return value becomes the job's result.
 */
export function registerJobHandler(name: string, handler: JobHandler): void {
  if (jobHandlers.has(name)) {
    logFn.warn(`Queue: job handler "${name}" already registered — overwriting`)
  }
  jobHandlers.set(name, handler)
  logFn.info(`Queue: job handler "${name}" registered`)
}

/**
 * Unregister a previously registered handler.
 */
export function unregisterJobHandler(name: string): void {
  jobHandlers.delete(name)
  logFn.info(`Queue: job handler "${name}" unregistered`)
}
