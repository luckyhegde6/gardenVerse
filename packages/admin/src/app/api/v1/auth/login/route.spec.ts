jest.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
  },
}))

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from './route'
import { prisma } from '@/lib/prisma/client'
import bcrypt from 'bcrypt'

const jwt = jest.requireMock('jsonwebtoken')

const mockUser = {
  id: 'cm1abcd1234',
  email: 'gardener@example.com',
  username: 'greenthumb',
  displayName: 'Green Thumb',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=greenthumb',
  passwordHash: '$2b$12$abcdefghijklmnopqrstuv',
  role: 'USER',
  isVerified: true,
  isBlocked: false,
  blockedReason: null,
}

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access-token'

function createMockRequest(body: Record<string, unknown>): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Map(),
    cookies: { get: jest.fn() },
    url: 'http://localhost:3000/api/v1/auth/login',
  } as unknown as NextRequest
}

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(jwt.sign as jest.Mock).mockReturnValue(mockToken)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
  })

  it('should return 400 when email is missing', async () => {
    const req = createMockRequest({ password: 'password123' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Email and password are required')
  })

  it('should return 400 when password is missing', async () => {
    const req = createMockRequest({ email: 'gardener@example.com' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Email and password are required')
  })

  it('should return 401 when user is not found', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    const req = createMockRequest({
      email: 'unknown@example.com',
      password: 'password123',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid email or password')
  })

  it('should pass the correct email to prisma.user.findUnique', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    const req = createMockRequest({
      email: 'user@example.com',
      password: 'somepass',
    })
    await POST(req)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      select: expect.any(Object),
    })
  })

  it('should return 401 when password does not match', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
    const req = createMockRequest({
      email: 'gardener@example.com',
      password: 'wrongpassword',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid email or password')
  })

  it('should return 401 when email is not verified', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockUser,
      isVerified: false,
    })
    const req = createMockRequest({
      email: 'gardener@example.com',
      password: 'password123',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Please verify your email first')
  })

  it('should return 401 when account is blocked without a reason', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockUser,
      isBlocked: true,
      blockedReason: null,
    })
    const req = createMockRequest({
      email: 'gardener@example.com',
      password: 'password123',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe(
      'Account blocked. Please contact support for assistance.',
    )
  })

  it('should return 401 when account is blocked with a reason', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockUser,
      isBlocked: true,
      blockedReason: 'Violation of terms of service',
    })
    const req = createMockRequest({
      email: 'gardener@example.com',
      password: 'password123',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe(
      'Account blocked: Violation of terms of service. Please contact support for assistance.',
    )
  })

  it('should return 200 with tokens and user data on successful login', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    const req = createMockRequest({
      email: 'gardener@example.com',
      password: 'password123',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      accessToken: mockToken,
      refreshToken: mockToken,
      expiresIn: 900,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        displayName: mockUser.displayName,
        avatarUrl: mockUser.avatarUrl,
        role: 'user',
      },
    })
  })

  it('should update lastActiveAt and increment streak on successful login', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    const req = createMockRequest({
      email: 'gardener@example.com',
      password: 'password123',
    })
    await POST(req)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: {
        lastActiveAt: expect.any(Date),
        currentStreak: { increment: 1 },
      },
    })
  })

  it('should create a session record on successful login', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    const req = createMockRequest({
      email: 'gardener@example.com',
      password: 'password123',
    })
    await POST(req)
    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        token: mockToken,
        refreshToken: mockToken,
        expiresAt: expect.any(Date),
        userId: mockUser.id,
      },
    })
  })
})
