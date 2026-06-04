jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}))

import { NextRequest } from 'next/server'
import {
  signToken,
  verifyToken,
  getTokenFromRequest,
  unauthorized,
  forbidden,
  badRequest,
  notFound,
  serverError,
  success,
  paginated,
  requireAuth,
  requireRole,
  JwtPayload,
} from './auth'

const jwt = jest.requireMock('jsonwebtoken')

const mockPayload: JwtPayload = {
  userId: 'cm1abcd1234',
  email: 'gardener@example.com',
  role: 'USER',
}

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token'

function makeMockRequest(authHeader?: string, cookieToken?: string): NextRequest {
  const headers = { get: jest.fn() }
  if (authHeader) {
    ;(headers.get as jest.Mock).mockReturnValue(`Bearer ${authHeader}`)
  } else {
    ;(headers.get as jest.Mock).mockReturnValue(null)
  }

  const cookies = { get: jest.fn() }
  if (cookieToken) {
    ;(cookies.get as jest.Mock).mockReturnValue({ value: cookieToken })
  } else {
    ;(cookies.get as jest.Mock).mockReturnValue(null)
  }

  return { headers, cookies, url: 'http://localhost:3000' } as unknown as NextRequest
}

describe('signToken', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should sign a JWT with the given payload and default expiry', () => {
    ;(jwt.sign as jest.Mock).mockReturnValue(mockToken)
    const result = signToken(mockPayload)
    expect(jwt.sign).toHaveBeenCalledWith(mockPayload, expect.any(String), { expiresIn: '15m' })
    expect(result).toBe(mockToken)
  })

  it('should sign a JWT with custom expiry', () => {
    ;(jwt.sign as jest.Mock).mockReturnValue(mockToken)
    signToken(mockPayload, '7d')
    expect(jwt.sign).toHaveBeenCalledWith(mockPayload, expect.any(String), { expiresIn: '7d' })
  })
})

describe('verifyToken', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should verify and return the payload', () => {
    ;(jwt.verify as jest.Mock).mockReturnValue(mockPayload)
    const result = verifyToken(mockToken)
    expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String))
    expect(result).toEqual(mockPayload)
  })

  it('should throw for an invalid token', () => {
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt malformed')
    })
    expect(() => verifyToken(mockToken)).toThrow('jwt malformed')
  })

  it('should throw for an expired token', () => {
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt expired')
    })
    expect(() => verifyToken(mockToken)).toThrow('jwt expired')
  })
})

describe('getTokenFromRequest', () => {
  it('should extract token from Authorization header', () => {
    const req = makeMockRequest(mockToken)
    expect(getTokenFromRequest(req)).toBe(mockToken)
  })

  it('should return null when no Authorization header and no cookie', () => {
    const req = makeMockRequest()
    expect(getTokenFromRequest(req)).toBeNull()
  })

  it('should extract token from cookie when no Authorization header', () => {
    const req = makeMockRequest(undefined, mockToken)
    expect(getTokenFromRequest(req)).toBe(mockToken)
  })

  it('should prefer Authorization header over cookie', () => {
    const req = makeMockRequest('header-token', 'cookie-token')
    expect(getTokenFromRequest(req)).toBe('header-token')
  })
})

describe('response helpers', () => {
  it('unauthorized should return 401 with default message', async () => {
    const res = unauthorized()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'Unauthorized' })
  })

  it('unauthorized should use custom message', async () => {
    const res = unauthorized('Invalid credentials')
    const body = await res.json()
    expect(body).toEqual({ error: 'Invalid credentials' })
  })

  it('forbidden should return 403 with default message', async () => {
    const res = forbidden()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ error: 'Forbidden' })
  })

  it('forbidden should use custom message', async () => {
    const res = forbidden('Admin access required')
    const body = await res.json()
    expect(body).toEqual({ error: 'Admin access required' })
  })

  it('badRequest should return 400 with the provided message', async () => {
    const res = badRequest('Email already in use')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'Email already in use' })
  })

  it('notFound should return 404 with default message', async () => {
    const res = notFound()
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'Not found' })
  })

  it('notFound should use custom message', async () => {
    const res = notFound('Garden not found')
    const body = await res.json()
    expect(body).toEqual({ error: 'Garden not found' })
  })

  it('serverError should return 500 with Error message', async () => {
    const res = serverError(new Error('Database connection failed'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'Database connection failed' })
  })

  it('serverError should return fallback message for non-Error', async () => {
    const res = serverError('something went wrong')
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'Internal server error' })
  })

  it('success should return data with status 200', async () => {
    const data = { id: 'garden-1', name: 'My Garden' }
    const res = success(data)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(data)
  })

  it('success should accept a custom status code', async () => {
    const res = success({ id: 'garden-1' }, 201)
    expect(res.status).toBe(201)
  })

  it('paginated should return the correct shape', async () => {
    const data = [
      { id: 'crop-1', name: 'Tomato' },
      { id: 'crop-2', name: 'Basil' },
    ]
    const res = paginated(data, 25, 2, 10)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      data: [
        { id: 'crop-1', name: 'Tomato' },
        { id: 'crop-2', name: 'Basil' },
      ],
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    })
  })

  it('paginated should handle zero total gracefully', async () => {
    const res = paginated([], 0, 1, 20)
    const body = await res.json()
    expect(body).toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    })
  })
})

describe('requireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return payload for a valid token', () => {
    const req = makeMockRequest(mockToken)
    ;(jwt.verify as jest.Mock).mockReturnValue(mockPayload)
    const result = requireAuth(req)
    expect('payload' in result).toBe(true)
    if ('payload' in result) {
      expect(result.payload).toEqual(mockPayload)
    }
  })

  it('should return error when no token is present', () => {
    const req = makeMockRequest()
    const result = requireAuth(req)
    expect('error' in result).toBe(true)
  })

  it('should return error for an invalid token', () => {
    const req = makeMockRequest(mockToken)
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt malformed')
    })
    const result = requireAuth(req)
    expect('error' in result).toBe(true)
  })
})

describe('requireRole', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should pass when the user has one of the required roles', () => {
    const req = makeMockRequest(mockToken)
    ;(jwt.verify as jest.Mock).mockReturnValue({ ...mockPayload, role: 'ADMIN' })
    const result = requireRole(req, ['ADMIN', 'SUPER_ADMIN'])
    expect('payload' in result).toBe(true)
  })

  it('should fail when the user role does not match', () => {
    const req = makeMockRequest(mockToken)
    ;(jwt.verify as jest.Mock).mockReturnValue({ ...mockPayload, role: 'USER' })
    const result = requireRole(req, ['ADMIN', 'SUPER_ADMIN'])
    expect('error' in result).toBe(true)
  })

  it('should fail when no token is provided', () => {
    const req = makeMockRequest()
    const result = requireRole(req, ['ADMIN'])
    expect('error' in result).toBe(true)
  })

  it('should be case-insensitive when matching roles', () => {
    const req = makeMockRequest(mockToken)
    ;(jwt.verify as jest.Mock).mockReturnValue({ ...mockPayload, role: 'admin' })
    const result = requireRole(req, ['ADMIN', 'SUPER_ADMIN'])
    expect('payload' in result).toBe(true)
  })
})
