'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/db/client'
import { clientIp } from '@/lib/client-ip'
import { sendLoginCode } from '@/lib/mail'
import { hitRateLimit } from '@/lib/rate-limit'
import { signUserSession, USER_COOKIE, USER_MAX_AGE } from '@/lib/session'
import { issueLoginCode, normalizeEmail, safeNext, verifyLoginCode } from './login'

export type LoginState = { step: 'email' | 'code' | 'done'; email?: string; next?: string; error?: string; info?: string }

const MIN = 60 * 1000
const emailSchema = z.string().trim().toLowerCase().max(200).pipe(z.email())

export async function requestCodeAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(String(formData.get('email') ?? ''))
  if (!parsed.success) return { step: 'email', error: 'Некорректный email' }
  const email = parsed.data
  // каждый запрос шлёт письмо на введённый адрес — без лимитов форма станет рассыльщиком.
  // Лимит по email+ip (не по email одному) — иначе кто угодно, зная чужой адрес, мог бы
  // со своего IP исчерпать его лимит и заблокировать владельцу вход на 15 минут подряд.
  const ip = await clientIp()
  const byIp = await hitRateLimit(db, `login-ip:${ip}`, 10, 60 * MIN)
  const byEmail = await hitRateLimit(db, `login-email:${email}:${ip}`, 3, 15 * MIN)
  if (!byIp.ok || !byEmail.ok) return { step: 'email', email, error: 'Слишком много запросов кода. Попробуйте позже.' }

  const code = await issueLoginCode(db, email)
  const dev = process.env.NODE_ENV !== 'production'
  if (dev) console.info(`[login] code for ${email}: ${code}`)
  try {
    await sendLoginCode(email, code)
  } catch (e) {
    console.error('[login] mail failed:', e)
    if (!dev) return { step: 'email', email, error: 'Не удалось отправить письмо, попробуйте позже' }
  }
  return { step: 'code', email, info: `Отправили код на ${email}` }
}

export async function verifyCodeAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(String(formData.get('email') ?? ''))
  const limit = await hitRateLimit(db, `login-verify-ip:${await clientIp()}`, 30, 60 * MIN)
  if (!limit.ok) return { step: 'code', email, error: 'Слишком много попыток. Попробуйте через час.' }
  const res = await verifyLoginCode(db, email, String(formData.get('code') ?? ''))
  if (!res.ok) return { step: 'code', email, error: res.error }
  ;(await cookies()).set(USER_COOKIE, await signUserSession(res.userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: USER_MAX_AGE,
  })
  // редирект делает клиент: сначала он сливает локальное избранное с серверным
  return { step: 'done', email, next: safeNext(String(formData.get('next') ?? '')) }
}

export async function logoutAction(to = '/'): Promise<void> {
  ;(await cookies()).delete(USER_COOKIE)
  redirect(to === '/checkout' ? '/checkout' : '/')
}
