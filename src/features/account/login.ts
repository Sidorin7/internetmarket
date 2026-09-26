import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { and, eq, gt, lt, sql } from 'drizzle-orm'
import type { DB } from '@/db'
import { loginCodes, users } from '@/db/schema'

export const CODE_TTL_MS = 10 * 60 * 1000
export const MAX_ATTEMPTS = 5

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashCode(email: string, code: string): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return createHmac('sha256', secret).update(`${email}:${code}`).digest('hex')
}

export async function issueLoginCode(db: DB, rawEmail: string, now = Date.now()): Promise<string> {
  const email = normalizeEmail(rawEmail)
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const codeHash = hashCode(email, code)
  const expiresAt = now + CODE_TTL_MS
  await db
    .insert(loginCodes)
    .values({ email, codeHash, expiresAt, attempts: 0 })
    .onConflictDoUpdate({ target: loginCodes.email, set: { codeHash, expiresAt, attempts: 0 } })
    .run()
  return code
}

export type VerifyResult = { ok: true; userId: number } | { ok: false; error: string }

export async function verifyLoginCode(db: DB, rawEmail: string, rawCode: string, now = Date.now()): Promise<VerifyResult> {
  const email = normalizeEmail(rawEmail)
  const code = rawCode.replace(/\s/g, '')
  // попытка списывается атомарно до сравнения — параллельные запросы не обойдут лимит
  const row = await db
    .update(loginCodes)
    .set({ attempts: sql`${loginCodes.attempts} + 1` })
    .where(and(eq(loginCodes.email, email), lt(loginCodes.attempts, MAX_ATTEMPTS), gt(loginCodes.expiresAt, now)))
    .returning()
    .get()
  if (!row) {
    const existing = await db.select().from(loginCodes).where(eq(loginCodes.email, email)).get()
    if (existing && existing.expiresAt > now) return { ok: false, error: 'Слишком много неверных попыток — запросите новый код' }
    return { ok: false, error: 'Код устарел — запросите новый' }
  }
  const matches = /^\d{6}$/.test(code) && timingSafeEqual(Buffer.from(hashCode(email, code)), Buffer.from(row.codeHash))
  if (!matches) return { ok: false, error: 'Неверный код' }

  await db.delete(loginCodes).where(eq(loginCodes.email, email)).run()
  const user = await db
    .insert(users)
    .values({ email })
    .onConflictDoUpdate({ target: users.email, set: { email } })
    .returning({ id: users.id })
    .get()
  return { ok: true, userId: user.id }
}

export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/account'
  return next
}
