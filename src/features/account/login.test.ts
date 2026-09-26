import { beforeEach, describe, expect, it } from 'vitest'
import type { DB } from '@/db'
import { users } from '@/db/schema'
import { createTestDb } from '@/test/db'
import { CODE_TTL_MS, issueLoginCode, MAX_ATTEMPTS, safeNext, verifyLoginCode } from './login'

let db: DB
beforeEach(async () => {
  process.env.SESSION_SECRET = 'x'.repeat(40)
  db = await createTestDb()
})

const wrong = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, '0')

describe('login codes', () => {
  it('issues a 6-digit code that logs in once', async () => {
    const code = await issueLoginCode(db, 'a@a.ru')
    expect(code).toMatch(/^\d{6}$/)
    const res = await verifyLoginCode(db, 'a@a.ru', code)
    expect(res.ok).toBe(true)
    expect(await verifyLoginCode(db, 'a@a.ru', code)).toEqual({ ok: false, error: 'Код устарел — запросите новый' })
  })
  it('ignores email case and spaces, stores lower-case user', async () => {
    const code = await issueLoginCode(db, '  Anna@Mail.RU ')
    const res = await verifyLoginCode(db, 'anna@mail.ru', ` ${code.slice(0, 3)} ${code.slice(3)} `)
    expect(res.ok).toBe(true)
    expect((await db.select().from(users).all()).map((u) => u.email)).toEqual(['anna@mail.ru'])
  })
  it('returns the same user on the next login', async () => {
    const first = await verifyLoginCode(db, 'a@a.ru', await issueLoginCode(db, 'a@a.ru'))
    const second = await verifyLoginCode(db, 'A@a.ru', await issueLoginCode(db, 'a@a.ru'))
    expect(first).toEqual(second)
  })
  it('counts wrong attempts and locks after the limit', async () => {
    const code = await issueLoginCode(db, 'a@a.ru')
    expect(await verifyLoginCode(db, 'a@a.ru', wrong(code))).toEqual({ ok: false, error: 'Неверный код' })
    for (let i = 1; i < MAX_ATTEMPTS; i++) await verifyLoginCode(db, 'a@a.ru', wrong(code))
    expect(await verifyLoginCode(db, 'a@a.ru', code)).toEqual({ ok: false, error: 'Слишком много неверных попыток — запросите новый код' })
  })
  it('expires after TTL', async () => {
    const now = Date.now()
    const code = await issueLoginCode(db, 'a@a.ru', now)
    expect(await verifyLoginCode(db, 'a@a.ru', code, now + CODE_TTL_MS)).toEqual({ ok: false, error: 'Код устарел — запросите новый' })
  })
  it('a new code replaces the old one and resets attempts', async () => {
    const c1 = await issueLoginCode(db, 'a@a.ru')
    for (let i = 0; i < MAX_ATTEMPTS; i++) await verifyLoginCode(db, 'a@a.ru', wrong(c1))
    let c2 = await issueLoginCode(db, 'a@a.ru')
    while (c2 === c1) c2 = await issueLoginCode(db, 'a@a.ru')
    expect((await verifyLoginCode(db, 'a@a.ru', c1)).ok).toBe(false)
    expect((await verifyLoginCode(db, 'a@a.ru', c2)).ok).toBe(true)
  })
  it('rejects non-numeric input without crashing', async () => {
    await issueLoginCode(db, 'a@a.ru')
    expect(await verifyLoginCode(db, 'a@a.ru', 'abcdef')).toEqual({ ok: false, error: 'Неверный код' })
  })
})

describe('safeNext', () => {
  it('allows local paths only', () => {
    expect(safeNext('/checkout')).toBe('/checkout')
    expect(safeNext('/account/orders/100001')).toBe('/account/orders/100001')
    for (const bad of [undefined, null, '', 'https://evil.com', '//evil.com', '/\\evil.com', 'account']) expect(safeNext(bad)).toBe('/account')
  })
})
