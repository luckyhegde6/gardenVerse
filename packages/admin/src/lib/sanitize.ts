import { resolve, join } from 'path'

/**
 * Resolves a user-provided path within a base directory and verifies
 * it does not escape the base (prevents path traversal attacks).
 * Returns the resolved path, or null if the path escapes the base.
 */
export function resolveContained(baseDir: string, userPath: string): string | null {
  const resolvedBase = resolve(baseDir)
  const resolved = resolve(join(resolvedBase, userPath))

  if (!resolved.startsWith(resolvedBase + '/') && resolved !== resolvedBase) {
    return null
  }

  return resolved
}

/**
 * Sanitizes a string for use in Prisma `contains` (LIKE) filters.
 * Escapes SQL LIKE wildcard characters (% and _) and truncates.
 */
export function sanitizeLike(value: string, maxLen = 100): string {
  return value
    .replace(/[%_\\]/g, '\\$&') // escape LIKE wildcards
    .replace(/[<>]/g, '')        // strip angle brackets (XSS prevention)
    .slice(0, maxLen)
    .trim()
}

/**
 * Sanitizes a general string input — strips HTML tags and truncates.
 */
export function sanitizeString(value: string, maxLen: number): string {
  return value
    .replace(/[<>]/g, '')
    .slice(0, maxLen)
    .trim()
}

/**
 * Validates and parses a positive integer from a string.
 */
export function parsePositiveInt(value: string | null, fallback: number, max = 10000): number {
  if (!value) return fallback
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

/**
 * Validates an email format.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
}
