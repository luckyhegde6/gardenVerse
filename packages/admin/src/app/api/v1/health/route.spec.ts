import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/v1/health', () => {
  it('should return status ok with timestamp and uptime', async () => {
    const request = {} as NextRequest
    const response = await GET(request)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      uptime: expect.any(String),
    })
  })

  it('should include a valid ISO timestamp', async () => {
    const request = {} as NextRequest
    const response = await GET(request)
    const body = await response.json()
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp)
  })

  it('should include uptime as a number of seconds', async () => {
    const request = {} as NextRequest
    const response = await GET(request)
    const body = await response.json()
    expect(body.uptime).toMatch(/^\d+s$/)
  })
})
