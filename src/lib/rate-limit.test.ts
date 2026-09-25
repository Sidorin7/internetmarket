import { describe, expect, it } from 'vitest'
import { createTestDb } from '@/test/db'
import { hitRateLimit } from './rate-limit'

describe('hitRateLimit', () => {
  it('allows up to the limit per key within the window, then blocks until it resets', async () => {
    const db = await createTestDb()
    for (let i = 0; i < 3; i++) expect((await hitRateLimit(db, 'login:1.2.3.4', 3, 60_000, 1000)).ok).toBe(true)
    expect(await hitRateLimit(db, 'login:1.2.3.4', 3, 60_000, 5000)).toEqual({ ok: false, retryAfterMs: 56_000 })
    expect((await hitRateLimit(db, 'login:5.6.7.8', 3, 60_000, 5000)).ok).toBe(true)
    expect((await hitRateLimit(db, 'login:1.2.3.4', 3, 60_000, 61_000)).ok).toBe(true)
  })
})
