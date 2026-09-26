'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { z } from 'zod'
import { db } from '@/db/client'
import { orders } from '@/db/schema'
import { fillEmptyProfile } from '@/features/account/profile'
import { clientIp } from '@/lib/client-ip'
import { sendOrderEmails } from '@/lib/mail'
import { orderToken } from '@/lib/order-token'
import { hitRateLimit } from '@/lib/rate-limit'
import { getCurrentUser } from '@/lib/user'
import { createOrder } from './create-order'
import { checkoutSchema } from './schema'

export type CheckoutState = {
  error?: string
  fieldErrors?: Partial<Record<'name' | 'phone' | 'email' | 'address' | 'comment' | 'items', string[]>>
  values?: Record<string, string>
  badVariantId?: number
}

function parseItems(raw: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(String(raw ?? '[]'))
  } catch {
    return []
  }
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const values = Object.fromEntries(
    ['name', 'phone', 'email', 'address', 'comment'].map((k) => [k, String(formData.get(k) ?? '')]),
  )
  const user = await getCurrentUser()
  // заказ вошедшего всегда на email аккаунта — иначе он не увидит его в кабинете
  if (user) values.email = user.email
  const parsed = checkoutSchema.safeParse({ ...values, items: parseItems(formData.get('items')) })
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values }

  // каждый заказ шлёт письмо на указанный адрес — без лимита форму можно превратить в рассыльщик
  const limit = await hitRateLimit(db, `order:${await clientIp()}`, 10, 60 * 60 * 1000)
  if (!limit.ok) return { error: 'Слишком много заказов подряд. Попробуйте через час или позвоните нам.', values }

  const { items, ...customer } = parsed.data
  const result = await createOrder(db, { customer, items })
  if (!result.ok) return { error: result.error, badVariantId: result.variantId, values }
  if (user) await fillEmptyProfile(db, user.id, { name: customer.name, phone: customer.phone, address: customer.address })

  // письма уходят после ответа: медленный SMTP не должен держать покупателя на «Оформляем…»
  after(async () => {
    const sent = await sendOrderEmails(result.order)
    if (sent) await db.update(orders).set({ emailSent: true }).where(eq(orders.id, result.order.id)).run()
  })

  redirect(`/order/${result.order.number}?new=1&t=${orderToken(result.order.number)}`)
}
