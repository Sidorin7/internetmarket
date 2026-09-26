'use server'

import { refresh, revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { z } from 'zod'
import { db } from '@/db/client'
import { sendCancelEmail } from '@/lib/mail'
import { getCurrentUser } from '@/lib/user'
import { cancelOrderByCustomer } from './orders'
import { profileSchema, updateProfile } from './profile'

export async function cancelOrderAction(number: string): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Войдите заново' }
  const res = await cancelOrderByCustomer(db, user.email, String(number))
  if (!res.ok) return { error: res.error }
  after(() => sendCancelEmail(res.order).catch((e) => console.error(`[mail] cancel ${res.order.number}:`, e)))
  revalidatePath('/', 'layout') // вернулись остатки — меняется витрина
  return {}
}

export type ProfileState = {
  ok?: boolean
  error?: string
  fieldErrors?: Partial<Record<'name' | 'phone' | 'address', string[]>>
  values?: Record<string, string>
}

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Войдите заново' }
  const values = Object.fromEntries(['name', 'phone', 'address'].map((k) => [k, String(formData.get(k) ?? '')]))
  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values }
  await updateProfile(db, user.id, parsed.data)
  refresh()
  return { ok: true, values }
}
