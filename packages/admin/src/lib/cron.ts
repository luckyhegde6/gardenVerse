/**
 * Scheduled task helper — replaces NestJS @Cron / @Schedule decorators.
 *
 * In the NestJS backend, the @Cron decorator from @nestjs/schedule was used
 * for periodic tasks (gameplay simulation every 4h, weather fetch every 6h,
 * weather alerts every 1h).
 *
 * In this serverless environment, Vercel Cron Jobs handle the scheduling:
 *   - Configured in vercel.json or Vercel dashboard
 *   - Each cron job calls a dedicated API route
 *   - The route handler is protected by CRON_SECRET header
 *
 * This module provides utility types and helpers for task tracking.
 */

import logFn from '@/lib/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaskInterval = 'every_1_hour' | 'every_4_hours' | 'every_6_hours' | 'every_12_hours' | 'every_day'

export interface TaskDefinition {
  /** Unique task identifier (e.g., 'growth-tick', 'weather-sync') */
  id: string
  /** Human-readable name */
  name: string
  /** How often the task should run */
  interval: TaskInterval
  /** Description of what the task does */
  description: string
  /** Route path (for documentation) */
  route: string
  /** Whether this is enabled */
  enabled: boolean
  /** When this task was registered */
  registeredAt: string
  /** Last time this task was executed (populated at runtime) */
  lastRun?: string
}

// ---------------------------------------------------------------------------
// Task registry
// ---------------------------------------------------------------------------

const taskRegistry = new Map<string, TaskDefinition>()

/**
 * Register a cron task definition.
 */
export function registerTask(task: TaskDefinition): void {
  if (taskRegistry.has(task.id)) {
    logFn.warn(`Cron: task "${task.id}" already registered — overwriting`)
  }
  taskRegistry.set(task.id, task)
  logFn.info(`Cron: task "${task.id}" registered (interval: ${task.interval})`)
}

/**
 * Get a task definition by ID.
 */
export function getTask(id: string): TaskDefinition | undefined {
  return taskRegistry.get(id)
}

/**
 * List all registered tasks.
 */
export function listTasks(): TaskDefinition[] {
  return Array.from(taskRegistry.values())
}

/**
 * Unregister a task.
 */
export function unregisterTask(id: string): void {
  taskRegistry.delete(id)
  logFn.info(`Cron: task "${id}" unregistered`)
}

/**
 * Update the last run timestamp for a task.
 */
export function recordTaskRun(id: string, timestamp?: string): void {
  const task = taskRegistry.get(id)
  if (task) {
    task.lastRun = timestamp || new Date().toISOString()
  }
}

// ---------------------------------------------------------------------------
// Utility: shouldRun
// ---------------------------------------------------------------------------

/**
 * Determines whether a task should run based on the last run time and the
 * desired interval. Useful for idempotent cron handlers that may be called
 * more frequently than expected.
 *
 * @param lastRun  Date when the task last ran (null/undefined if never run)
 * @param intervalMinutes  Minimum interval in minutes between runs
 * @returns true  if the task should run now
 */
export function shouldRun(lastRun: Date | null | undefined, intervalMinutes: number): boolean {
  if (!lastRun) return true
  const elapsed = (Date.now() - lastRun.getTime()) / (1000 * 60)
  return elapsed >= intervalMinutes
}

/**
 * Convert a TaskInterval to its equivalent in minutes.
 */
export function intervalToMinutes(interval: TaskInterval): number {
  const map: Record<TaskInterval, number> = {
    every_1_hour: 60,
    every_4_hours: 240,
    every_6_hours: 360,
    every_12_hours: 720,
    every_day: 1440,
  }
  return map[interval]
}

/**
 * Convert minutes to a human-readable label.
 */
export function minutesToLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) return `${minutes / 60}h`
  return `${minutes / 1440}d`
}

// ---------------------------------------------------------------------------
// Register built-in tasks
// ---------------------------------------------------------------------------

registerTask({
  id: 'growth-tick',
  name: 'Growth Tick',
  interval: 'every_4_hours',
  description: 'Advances all virtual garden crops by 1 game tick (50 game-minutes)',
  route: '/api/v1/cron/growth-tick',
  enabled: true,
  registeredAt: new Date().toISOString(),
})

registerTask({
  id: 'weather-sync',
  name: 'Weather Sync',
  interval: 'every_6_hours',
  description: 'Simulates weather updates for all regions',
  route: '/api/v1/cron/weather-sync',
  enabled: true,
  registeredAt: new Date().toISOString(),
})
