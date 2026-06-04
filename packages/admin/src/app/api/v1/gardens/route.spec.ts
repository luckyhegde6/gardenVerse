jest.mock('@/lib/prisma/client', () => ({
  prisma: {
    garden: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    plantSpecies: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { GET as GardensGET } from '@/app/api/v1/gardens/route'
import { GET as PlantsGET } from '@/app/api/v1/plants/route'
import { prisma } from '@/lib/prisma/client'

const jwt = jest.requireMock('jsonwebtoken')

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token'
const mockPayload = {
  userId: 'cm1abcd1234',
  email: 'gardener@example.com',
  role: 'USER',
}

function makeRequest(url: string): NextRequest {
  return {
    headers: { get: jest.fn().mockReturnValue(`Bearer ${mockToken}`) },
    cookies: { get: jest.fn() },
    url,
  } as unknown as NextRequest
}

describe('GET /api/v1/gardens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(jwt.verify as jest.Mock).mockReturnValue(mockPayload)
  })

  it('should return paginated empty list when no gardens exist', async () => {
    ;(prisma.garden.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.garden.count as jest.Mock).mockResolvedValue(0)

    const req = makeRequest('http://localhost:3000/api/v1/gardens')
    const res = await GardensGET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    })
  })

  it('should return gardens when data exists', async () => {
    const gardens = [
      {
        id: 'garden-1',
        name: 'Bangalore Terrace Garden',
        type: 'VIRTUAL',
        userId: mockPayload.userId,
        crops: [],
        user: { id: mockPayload.userId, username: 'greenthumb', displayName: 'Green Thumb', email: 'gardener@example.com', region: 'Bangalore' },
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-06-01'),
      },
    ]
    ;(prisma.garden.findMany as jest.Mock).mockResolvedValue(gardens)
    ;(prisma.garden.count as jest.Mock).mockResolvedValue(1)

    const req = makeRequest('http://localhost:3000/api/v1/gardens')
    const res = await GardensGET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].name).toBe('Bangalore Terrace Garden')
    expect(body.total).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('should pass query params (userId, type) to prisma', async () => {
    ;(prisma.garden.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.garden.count as jest.Mock).mockResolvedValue(0)

    const req = makeRequest(
      'http://localhost:3000/api/v1/gardens?userId=user-1&type=VIRTUAL',
    )
    await GardensGET(req)

    expect(prisma.garden.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', type: 'VIRTUAL' },
      }),
    )
  })

  it('should return 401 when no auth token provided', async () => {
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('No token')
    })

    const req = {
      headers: { get: jest.fn().mockReturnValue(null) },
      cookies: { get: jest.fn().mockReturnValue(null) },
      url: 'http://localhost:3000/api/v1/gardens',
    } as unknown as NextRequest

    const res = await GardensGET(req)
    expect(res.status).toBe(401)
  })

  it('should handle server errors gracefully', async () => {
    ;(prisma.garden.findMany as jest.Mock).mockRejectedValue(
      new Error('Database connection failed'),
    )
    ;(jwt.verify as jest.Mock).mockReturnValue(mockPayload)

    const req = makeRequest('http://localhost:3000/api/v1/gardens')
    const res = await GardensGET(req)
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.error).toBe('Database connection failed')
  })
})

describe('GET /api/v1/plants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return paginated empty list when no plants exist', async () => {
    ;(prisma.plantSpecies.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.plantSpecies.count as jest.Mock).mockResolvedValue(0)

    const req = makeRequest('http://localhost:3000/api/v1/plants')
    const res = await PlantsGET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    })
  })

  it('should return plants when data exists', async () => {
    const plants = [
      {
        id: 'plant-1',
        commonName: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        family: 'Solanaceae',
        difficulty: 'MEDIUM',
        edible: true,
      },
    ]
    ;(prisma.plantSpecies.findMany as jest.Mock).mockResolvedValue(plants)
    ;(prisma.plantSpecies.count as jest.Mock).mockResolvedValue(1)

    const req = makeRequest('http://localhost:3000/api/v1/plants')
    const res = await PlantsGET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].commonName).toBe('Tomato')
    expect(body.total).toBe(1)
  })

  it('should pass search query to prisma', async () => {
    ;(prisma.plantSpecies.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.plantSpecies.count as jest.Mock).mockResolvedValue(0)

    const req = makeRequest('http://localhost:3000/api/v1/plants?q=tomato')
    await PlantsGET(req)

    expect(prisma.plantSpecies.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ commonName: expect.any(Object) }),
          ]),
        }),
      }),
    )
  })

  it('should pass difficulty filter to prisma', async () => {
    ;(prisma.plantSpecies.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.plantSpecies.count as jest.Mock).mockResolvedValue(0)

    const req = makeRequest(
      'http://localhost:3000/api/v1/plants?difficulty=easy',
    )
    await PlantsGET(req)

    expect(prisma.plantSpecies.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          difficulty: 'EASY',
        }),
      }),
    )
  })

  it('should handle server errors gracefully', async () => {
    ;(prisma.plantSpecies.findMany as jest.Mock).mockRejectedValue(
      new Error('Database timeout'),
    )

    const req = makeRequest('http://localhost:3000/api/v1/plants')
    const res = await PlantsGET(req)
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.error).toBe('Database timeout')
  })
})
