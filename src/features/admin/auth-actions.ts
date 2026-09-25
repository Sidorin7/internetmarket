'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { checkPassword, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from '@/lib/session'

export async function login(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
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
