import { plainToInstance } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import { NextResponse } from 'next/server'

export async function validateBody<T extends object>(body: unknown, dto: new () => T): Promise<T | NextResponse> {
  const instance = plainToInstance(dto, body as Record<string, unknown>)
  const errors = await validate(instance)
  if (errors.length > 0) {
    const messages = errors.map((e: ValidationError) => {
      const constraints = e.constraints || {}
      return Object.values(constraints).join(', ')
    }).filter(Boolean)
    return NextResponse.json({ error: 'Validation failed', details: messages }, { status: 400 })
  }
  return instance
}

export async function validateQuery<T extends object>(searchParams: URLSearchParams, dto: new () => T): Promise<T | NextResponse> {
  const raw: Record<string, string> = {}
  searchParams.forEach((value, key) => { raw[key] = value })
  const instance = plainToInstance(dto, raw)
  const errors = await validate(instance)
  if (errors.length > 0) {
    const messages = errors.map((e: ValidationError) => {
      const constraints = e.constraints || {}
      return Object.values(constraints).join(', ')
    }).filter(Boolean)
    return NextResponse.json({ error: 'Validation failed', details: messages }, { status: 400 })
  }
  return instance
}
