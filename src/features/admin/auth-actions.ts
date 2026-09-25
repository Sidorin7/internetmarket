'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { clientIp } from '@/lib/client-ip'
import { hitRateLimit } from '@/lib/rate-limit'
import { checkPassword, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from '@/lib/session'

export async function login(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  // пароль один на весь магазин — перебор ограничиваем по IP, общий счётчик в БД работает на всех инстансах
  const limit = await hitRateLimit(db, `login:${await clientIp()}`, 10, 15 * 60 * 1000)
  if (!limit.ok) return { error: `Слишком много попыток. Попробуйте через ${Math.ceil(limit.retryAfterMs / 60000)} мин.` }
  if (!checkPassword(String(formData.get('password') ?? ''))) {
    await new Promise((r) => setTimeout(r, 500)) // притормаживаем перебор
    return { error: 'Неверный пароль' }
  }
  ;(await cookies()).set(SESSION_COOKIE, await signSession(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  redirect('/admin/products')
}

export async function logout() {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect('/admin/login')
}
