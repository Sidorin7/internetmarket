import { beforeEach, describe, expect, it } from 'vitest'
import { orderToken, verifyOrderToken } from './order-token'

beforeEach(() => {
  process.env.SESSION_SECRET = 'x'.repeat(40)
})

describe('order token', () => {
  it('opens only the order it was issued for', () => {
    const t = orderToken('100001')
    expect(verifyOrderToken('100001', t)).toBe(true)
    expect(verifyOrderToken('100002', t)).toBe(false)
    expect(verifyOrderToken('100001', undefined)).toBe(false)
    expect(verifyOrderToken('100001', 'garbage')).toBe(false)
    process.env.SESSION_SECRET = 'y'.repeat(40)
    expect(verifyOrderToken('100001', t)).toBe(false)
  })
})
