import { describe, expect, it } from 'vitest'
import { dbConfigFromEnv } from './index'

describe('dbConfigFromEnv', () => {
  it('prefers DATABASE_*, falls back to TURSO_* from the Vercel integration, then local file', () => {
    expect(dbConfigFromEnv({ DATABASE_URL: 'libsql://a.turso.io', DATABASE_AUTH_TOKEN: 't1', TURSO_DATABASE_URL: 'libsql://b.turso.io' }))
      .toEqual({ url: 'libsql://a.turso.io', authToken: 't1' })
    expect(dbConfigFromEnv({ TURSO_DATABASE_URL: 'libsql://b.turso.io', TURSO_AUTH_TOKEN: 't2' }))
      .toEqual({ url: 'libsql://b.turso.io', authToken: 't2' })
    expect(dbConfigFromEnv({})).toEqual({ url: 'data/shop.db', authToken: undefined })
  })
})
