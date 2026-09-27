import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { DB } from '@/db'
import { users } from '@/db/schema'
import { normalizePhone } from '@/lib/phone'

export const profileSchema = z.object({
  name: z.string().trim().max(100, 'Не больше 100 символов'),
  phone: z.string().transform((v, ctx) => {
    if (!v.trim()) return ''
    const phone = normalizePhone(v)
    if (!phone) {
      ctx.addIssue({ code: 'custom', message: 'Телефон в формате +7 900 000-00-00' })
      return z.NEVER
    }
    return phone
  }),
  address: z.string().trim().max(300, 'Не больше 300 символов'),
})

export type ProfileInput = z.infer<typeof profileSchema>

export async function updateProfile(db: DB, userId: number, data: ProfileInput): Promise<void> {
  await db.update(users).set(data).where(eq(users.id, userId)).run()
}

export async function fillEmptyProfile(db: DB, userId: number, data: ProfileInput): Promise<void> {
  await db
    .update(users)
    .set({
      name: sql`case when ${users.name} = '' then ${data.name} else ${users.name} end`,
      phone: sql`case when ${users.phone} = '' then ${data.phone} else ${users.phone} end`,
      address: sql`case when ${users.address} = '' then ${data.address} else ${users.address} end`,
    })
    .where(eq(users.id, userId))
    .run()
}
