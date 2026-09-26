import { eq } from 'drizzle-orm'
import { beforeEach, expect, it } from 'vitest'
import type { DB } from '@/db'
import { orders, productVariants } from '@/db/schema'
import { createOrder } from '@/features/orders/create-order'
import { createTestDb, seedFixture, type Fixture } from '@/test/db'
import { setOrderStatus } from './orders'

let db: DB
let f: Fixture
beforeEach(async () => {
  db = await createTestDb()
  f = await seedFixture(db)
})

const customer = { name: 'Анна', phone: '+79001234567', email: 'a@a.ru', address: 'Москва 1', comment: '' }

it('stamps the date of each status change', async () => {
  const res = await createOrder(db, { customer, items: [{ variantId: f.variants.sneakers40.id, qty: 2 }] })
  if (!res.ok) throw new Error(res.error)
  const id = res.order.id
  const t1 = new Date('2026-09-20T10:00:00Z')
  const t2 = new Date('2026-09-21T10:00:00Z')
  const t3 = new Date('2026-09-22T10:00:00Z')
  await setOrderStatus(db, id, 'confirmed', t1)
  await setOrderStatus(db, id, 'shipped', t2)
  let o = (await db.select().from(orders).where(eq(orders.id, id)).get())!
  expect([o.confirmedAt, o.shippedAt, o.cancelledAt]).toEqual([t1, t2, null])
  await setOrderStatus(db, id, 'cancelled', t3)
  o = (await db.select().from(orders).where(eq(orders.id, id)).get())!
  expect(o.cancelledAt).toEqual(t3)
  const v = (await db.select().from(productVariants).where(eq(productVariants.id, f.variants.sneakers40.id)).get())!
  expect(v.stock).toBe(5)
})
