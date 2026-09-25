import { z } from 'zod'
import { normalizePhone } from '@/lib/phone'

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Укажите имя').max(100),
  phone: z.string().transform((v, ctx) => {
    const phone = normalizePhone(v)
    if (!phone) {
      ctx.addIssue({ code: 'custom', message: 'Телефон в формате +7 900 000-00-00' })
      return z.NEVER
    }
    return phone
  }),
  email: z.string().trim().max(200).pipe(z.email('Некорректный email')),
  address: z.string().trim().min(5, 'Укажите адрес доставки').max(300),
  comment: z.string().trim().max(500, 'Не больше 500 символов').default(''),
  items: z
    .array(z.object({ variantId: z.number().int().positive(), qty: z.number().int().min(1).max(99) }))
    .min(1, 'Корзина пуста')
    .max(100),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
