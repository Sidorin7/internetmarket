import { beforeEach, describe, expect, it } from 'vitest'
import { checkPassword, signSession, verifySession } from './session'

beforeEach(() => {
  process.env.SESSION_SECRET = 'x'.repeat(40)
  process.env.ADMIN_PASSWORD = 'secret-pass'
})

describe('session', () => {
  it('verifies own token', async () => {
    expect(await verifySession(await signSession())).toBe(true)
  })
  it('rejects missing, garbage and foreign tokens', async () => {
    expect(await verifySession(undefined)).toBe(false)
    expect(await verifySession('garbage')).toBe(false)
    const token = await signSession()
    process.env.SESSION_SECRET = 'y'.repeat(40)
    expect(await verifySession(token)).toBe(false)
  })
})

describe('checkPassword', () => {
  it('compares with ADMIN_PASSWORD', () => {
    expect(checkPassword('secret-pass')).toBe(true)
    expect(checkPassword('wrong')).toBe(false)
  })
  it('denies everything when ADMIN_PASSWORD is empty', () => {
    process.env.ADMIN_PASSWORD = ''
    expect(checkPassword('')).toBe(false)
  })
})
