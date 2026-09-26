import { beforeEach, describe, expect, it } from 'vitest'
import { SignJWT } from 'jose'
import { checkPassword, signSession, signUserSession, verifySession, verifyUserSession, weakConfigReason } from './session'

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

describe('weakConfigReason', () => {
  const strong = { SESSION_SECRET: 'q'.repeat(20) + 'Zx9-' + 'w'.repeat(24), ADMIN_PASSWORD: 'Korova-Molоko-42' }
  it('refuses placeholders and short passwords in production', () => {
    expect(weakConfigReason({ ...strong, NODE_ENV: 'production' })).toBeNull()
    expect(weakConfigReason({ ...strong, NODE_ENV: 'production', SESSION_SECRET: 'replace-with-at-least-32-random-characters-xxxxx' })).toMatch(/SESSION_SECRET/)
    expect(weakConfigReason({ ...strong, NODE_ENV: 'production', ADMIN_PASSWORD: 'change-me' })).toMatch(/ADMIN_PASSWORD/)
    expect(weakConfigReason({ ...strong, NODE_ENV: 'production', ADMIN_PASSWORD: 'short-pass' })).toMatch(/ADMIN_PASSWORD/)
  })
  it('allows placeholders in development', () => {
    expect(weakConfigReason({ NODE_ENV: 'development', SESSION_SECRET: 'replace-with-at-least-32-random-characters-xxxxx', ADMIN_PASSWORD: 'change-me' })).toBeNull()
  })
})

describe('user session', () => {
  it('roundtrips user id', async () => {
    expect(await verifyUserSession(await signUserSession(42))).toBe(42)
  })
  it('does not mix admin and user tokens', async () => {
    expect(await verifySession(await signUserSession(1))).toBe(false)
    expect(await verifyUserSession(await signSession())).toBeNull()
  })
  it('rejects missing, garbage and non-numeric subjects', async () => {
    expect(await verifyUserSession(undefined)).toBeNull()
    expect(await verifyUserSession('garbage')).toBeNull()
    const key = new TextEncoder().encode(process.env.SESSION_SECRET)
    const forged = await new SignJWT({ role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject('1 or 1=1').setExpirationTime('1d').sign(key)
    expect(await verifyUserSession(forged)).toBeNull()
  })
})
