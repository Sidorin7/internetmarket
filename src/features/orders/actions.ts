'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { z } from 'zod'
import { db } from '@/db/client'
import { orders } from '@/db/schema'
import { sendOrderEmails } from '@/lib/mail'
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
  const parsed = checkoutSchema.safeParse({ ...values, items: parseItems(formData.get('items')) })
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values }

  const { items, ...customer } = parsed.data
  const result = createOrder(db, { customer, items })
  if (!result.ok) return { error: result.error, badVariantId: result.variantId, values }

  // письма уходят после ответа: медленный SMTP не должен держать покупателя на «Оформляем…»
  after(async () => {
    const sent = await sendOrderEmails(result.order)
    if (sent) db.update(orders).set({ emailSent: true }).where(eq(orders.id, result.order.id)).run()
  })

  redirect(`/order/${result.order.number}?new=1`)
}
