import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import type { DB } from '@/db'
import { orderItems, orders, productVariants } from '@/db/schema'
import { createTestDb, seedFixture, type Fixture } from '@/test/db'
import { createOrder, type OrderInput } from './create-order'
import { getOrderByNumber } from './queries'

let db: DB
let f: Fixture
beforeEach(() => {
  db = createTestDb()
  f = seedFixture(db)
})

const customer = { name: 'Анна', phone: '+79001234567', email: 'anna@example.com', address: 'Москва, ул. Ленина, 1', comment: '' }
const order = (items: OrderInput['items']): OrderInput => ({ customer, items })
const stockOf = (id: number) => db.select().from(productVariants).where(eq(productVariants.id, id)).get()!.stock

describe('createOrder', () => {
  it('creates order with db prices, decrements stock, numbers from 100001', () => {
    const res = createOrder(db, order([{ variantId: f.variants.dressS.id, qty: 2 }, { variantId: f.variants.sneakers40.id, qty: 1 }]))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.order.number).toBe('100001')
    expect(res.order.total).toBe(499000 * 2 + 299000)
    expect(res.order.items).toEqual([
      { title: 'Льняное платье', size: 'S', price: 499000, qty: 2 },
      { title: 'Кеды белые', size: '40', price: 299000, qty: 1 },
    ])
    expect(stockOf(f.variants.dressS.id)).toBe(1)
    expect(stockOf(f.variants.sneakers40.id)).toBe(4)
    expect(getOrderByNumber(db, '100001')).toMatchObject({ customerName: 'Анна', total: res.order.total })
  })

  it('merges duplicate variant lines', () => {
    const res = createOrder(db, order([{ variantId: f.variants.dressS.id, qty: 1 }, { variantId: f.variants.dressS.id, qty: 1 }]))
    expect(res.ok && res.order.items).toEqual([{ title: 'Льняное платье', size: 'S', price: 499000, qty: 2 }])
  })

  it('rejects qty over stock and changes nothing', () => {
    const res = createOrder(db, order([{ variantId: f.variants.sneakers40.id, qty: 1 }, { variantId: f.variants.dressL.id, qty: 2 }]))
    expect(res).toEqual({ ok: false, error: '«Льняное платье» (L): осталось 1 шт.', variantId: f.variants.dressL.id })
    expect(stockOf(f.variants.sneakers40.id)).toBe(5)
    expect(db.select().from(orders).all()).toHaveLength(0)
    expect(db.select().from(orderItems).all()).toHaveLength(0)
  })

  it('does not oversell on sequential orders', () => {
    expect(createOrder(db, order([{ variantId: f.variants.dressL.id, qty: 1 }])).ok).toBe(true)
    const second = createOrder(db, order([{ variantId: f.variants.dressL.id, qty: 1 }]))
    expect(second).toMatchObject({ ok: false, error: '«Льняное платье» (L): нет в наличии' })
    expect(stockOf(f.variants.dressL.id)).toBe(0)
  })

  it('rejects inactive product', () => {
    expect(createOrder(db, order([{ variantId: f.variants.hiddenM.id, qty: 1 }]))).toMatchObject({ ok: false, error: 'Товар «Старое платье» больше не продаётся' })
  })

  it('rejects unknown variant', () => {
    expect(createOrder(db, order([{ variantId: 99999, qty: 1 }]))).toMatchObject({ ok: false, error: 'Один из товаров больше не продаётся', variantId: 99999 })
  })

  it('increments order numbers', () => {
    createOrder(db, order([{ variantId: f.variants.sneakers40.id, qty: 1 }]))
    const res = createOrder(db, order([{ variantId: f.variants.sneakers40.id, qty: 1 }]))
    expect(res.ok && res.order.number).toBe('100002')
  })
})
