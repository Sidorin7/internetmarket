import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import type { DB } from '@/db'
import { orders, productVariants, users } from '@/db/schema'
import { setOrderStatus } from '@/features/admin/orders'
import { createOrder } from '@/features/orders/create-order'
import { createTestDb, seedFixture, type Fixture } from '@/test/db'
import { cancelOrderByCustomer, getUserOrder, listUserOrders } from './orders'
import { fillEmptyProfile, profileSchema } from './profile'

let db: DB
let f: Fixture
beforeEach(async () => {
  db = await createTestDb()
  f = await seedFixture(db)
})

async function order(email: string, qty = 1) {
  const res = await createOrder(db, {
    customer: { name: 'Анна', phone: '+79001234567', email, address: 'Москва 1', comment: '' },
    items: [{ variantId: f.variants.sneakers40.id, qty }],
  })
  if (!res.ok) throw new Error(res.error)
  return res.order
}
const stock = async () => (await db.select().from(productVariants).where(eq(productVariants.id, f.variants.sneakers40.id)).get())!.stock
const DAY = 24 * 60 * 60 * 1000

describe('listUserOrders', () => {
  it('finds orders by email regardless of case and spaces', async () => {
    const mine = await order('Anna@Mail.RU')
    await order('other@x.ru')
    const { current, history } = await listUserOrders(db, ' anna@mail.ru ')
    expect(current.map((o) => o.number)).toEqual([mine.number])
    expect(current[0].items).toEqual([{ title: 'Кеды белые', size: '40', price: 299000, qty: 1 }])
    expect(history).toEqual([])
  })
  it('splits current and history', async () => {
    const now = new Date('2026-09-26T12:00:00Z')
    // последовательно: параллельные транзакции на одном in-memory соединении конфликтуют
    await db.update(productVariants).set({ stock: 100 }).where(eq(productVariants.id, f.variants.sneakers40.id)).run()
    const created: number[] = []
    for (let i = 0; i < 6; i++) created.push((await order('a@a.ru')).id)
    const [fresh, confirmed, shippedRecent, shippedOld, shippedLegacy, cancelled] = created
    await db.update(orders).set({ status: 'confirmed' }).where(eq(orders.id, confirmed)).run()
    await db.update(orders).set({ status: 'shipped', shippedAt: new Date(now.getTime() - 13 * DAY) }).where(eq(orders.id, shippedRecent)).run()
    await db.update(orders).set({ status: 'shipped', shippedAt: new Date(now.getTime() - 15 * DAY) }).where(eq(orders.id, shippedOld)).run()
    await db.update(orders).set({ status: 'shipped' }).where(eq(orders.id, shippedLegacy)).run()
    await db.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, cancelled)).run()
    const { current, history } = await listUserOrders(db, 'a@a.ru', now)
    expect(current.map((o) => o.id).sort()).toEqual([fresh, confirmed, shippedRecent].sort())
    expect(history.map((o) => o.id).sort()).toEqual([shippedOld, shippedLegacy, cancelled].sort())
  })
})

describe('getUserOrder', () => {
  it('hides other people orders', async () => {
    const o = await order('a@a.ru')
    expect((await getUserOrder(db, 'A@A.ru', o.number))?.id).toBe(o.id)
    expect(await getUserOrder(db, 'b@b.ru', o.number)).toBeNull()
  })
})

describe('cancelOrderByCustomer', () => {
  it('cancels a new order once and restocks', async () => {
    const o = await order('a@a.ru', 2)
    expect(await stock()).toBe(3)
    const now = new Date('2026-09-26T12:00:00Z')
    const res = await cancelOrderByCustomer(db, 'a@a.ru', o.number, now)
    expect(res).toEqual({ ok: true, order: { number: o.number, customerName: 'Анна', phone: '+79001234567', total: 598000 } })
    expect(await stock()).toBe(5)
    expect(await getUserOrder(db, 'a@a.ru', o.number)).toMatchObject({ status: 'cancelled', cancelledAt: now })
    expect(await cancelOrderByCustomer(db, 'a@a.ru', o.number)).toEqual({ ok: false, error: 'Заказ уже отменён' })
    expect(await stock()).toBe(5)
  })
  it('refuses once the seller confirmed the order', async () => {
    const o = await order('a@a.ru', 2)
    await setOrderStatus(db, o.id, 'confirmed')
    expect(await cancelOrderByCustomer(db, 'a@a.ru', o.number)).toEqual({ ok: false, error: 'Заказ уже подтверждён — чтобы отменить, позвоните нам' })
    expect(await stock()).toBe(3)
  })
  it('does not touch someone else order', async () => {
    const o = await order('a@a.ru')
    expect(await cancelOrderByCustomer(db, 'b@b.ru', o.number)).toEqual({ ok: false, error: 'Заказ не найден' })
  })
})

describe('profile', () => {
  it('fills only empty fields', async () => {
    const u = await db.insert(users).values({ email: 'a@a.ru', name: 'Аня' }).returning().get()
    await fillEmptyProfile(db, u.id, { name: 'Анна Петрова', phone: '+79001234567', address: 'Москва 1' })
    expect(await db.select().from(users).where(eq(users.id, u.id)).get()).toMatchObject({ name: 'Аня', phone: '+79001234567', address: 'Москва 1' })
  })
  it('validates phone but allows it empty', () => {
    expect(profileSchema.parse({ name: ' Анна ', phone: '', address: '' })).toEqual({ name: 'Анна', phone: '', address: '' })
    expect(profileSchema.parse({ name: '', phone: '8 900 123 45 67', address: '' }).phone).toBe('+79001234567')
    expect(profileSchema.safeParse({ name: '', phone: '123', address: '' }).success).toBe(false)
  })
})
