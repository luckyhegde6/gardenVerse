import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { badRequest, serverError } from '@/lib/middleware/auth'

// Rate limit: max 5 tickets per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }

  if (entry.count >= 5) return false

  entry.count++
  return true
}

function sanitizeString(value: string, maxLen: number): string {
  return value
    .replace(/[<>]/g, '') // strip angle brackets to prevent XSS
    .slice(0, maxLen)
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { subject, message, email, category, priority } = body

    // Validate required fields
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return badRequest('subject is required')
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return badRequest('message is required')
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return badRequest('email is required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) || email.length > 254) {
      return badRequest('invalid email format')
    }

    // Validate priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH']
    const safePriority = validPriorities.includes(priority) ? priority : 'MEDIUM'

    // Sanitize inputs
    const safeSubject = sanitizeString(subject, 200)
    const safeMessage = sanitizeString(message, 5000)
    const safeEmail = sanitizeString(email, 254).toLowerCase()
    const safeCategory = category ? sanitizeString(String(category), 50) : null

    // Find the first admin user to attach the ticket to
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Support system is not configured. Please contact the site owner directly.' },
        { status: 503 }
      )
    }

    // Store contact email + category in adminNotes since schema has no contactEmail field
    const adminNotesParts = [`Anonymous submission from: ${safeEmail}`]
    if (safeCategory) adminNotesParts.push(`Category: ${safeCategory}`)

    const ticket = await prisma.supportTicket.create({
      data: {
        subject: safeSubject,
        message: safeMessage,
        priority: safePriority,
        status: 'OPEN',
        userId: adminUser.id,
        adminNotes: adminNotesParts.join(' | '),
      },
    })

    return NextResponse.json(
      {
        id: ticket.id,
        message: 'Support ticket submitted successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    return serverError(error)
  }
}
