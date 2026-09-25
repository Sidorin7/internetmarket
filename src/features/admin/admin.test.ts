import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import type { DB } from '@/db'
import { products, productVariants } from '@/db/schema'
import { createOrder } from '@/features/orders/create-order'
import { createTestDb, seedFixture, type Fixture } from '@/test/db'
import { createCategory, deleteCategory, listCategoriesWithCounts, renameCategory } from './categories'
import { listOrders, setOrderStatus } from './orders'

let db: DB
let f: Fixture
beforeEach(() => {
  db = createTestDb()
  f = seedFixture(db)
})

describe('categories', () => {
  it('creates with transliterated unique slug', () => {
    expect(createCategory(db, 'Юбки')).toEqual({ ok: true })
    expect(createCategory(db, 'юбки')).toEqual({ ok: false, error: 'Категория с таким адресом уже есть' })
    expect(listCategoriesWithCounts(db).map((c) => [c.slug, c.products])).toEqual([['dresses', 2], ['shoes', 1], ['yubki', 0]])
  })
  it('refuses to delete non-empty category', () => {
    expect(deleteCategory(db, f.categories.dresses.id)).toEqual({ ok: false, error: 'В категории есть товары — сначала перенесите или удалите их' })
    createCategory(db, 'Пустая')
    const empty = listCategoriesWithCounts(db).find((c) => c.slug === 'pustaya')!
    expect(deleteCategory(db, empty.id)).toEqual({ ok: true })
  })
  it('renames keeping slug', () => {
    renameCategory(db, f.categories.shoes.id, 'Кроссовки и кеды')
    expect(listCategoriesWithCounts(db).find((c) => c.slug === 'shoes')!.name).toBe('Кроссовки и кеды')
  })
})

describe('orders', () => {
  it('lists newest first with items and updates status', () => {
    const customer = { name: 'Анна', phone: '+79001234567', email: 'a@a.ru', address: 'Москва 1', comment: '' }
    createOrder(db, { customer, items: [{ variantId: f.variants.dressS.id, qty: 1 }] })
    createOrder(db, { customer, items: [{ variantId: f.variants.sneakers40.id, qty: 2 }] })
    const list = listOrders(db)
    expect(list.map((o) => o.number)).toEqual(['100002', '100001'])
    expect(list[0]).toMatchObject({ status: 'new', emailSent: false, items: [{ title: 'Кеды белые', qty: 2 }] })
    setOrderStatus(db, list[0].id, 'shipped')
    expect(listOrders(db)[0].status).toBe('shipped')
  })

  it('returns stock on cancel once and refuses to reopen cancelled order', () => {
    const customer = { name: 'Анна', phone: '+79001234567', email: 'a@a.ru', address: 'Москва 1', comment: '' }
    const stockOf = (id: number) => db.select().from(productVariants).where(eq(productVariants.id, id)).get()!.stock
    const before = stockOf(f.variants.sneakers40.id)
    const res = createOrder(db, { customer, items: [{ variantId: f.variants.sneakers40.id, qty: 2 }] })
    if (!res.ok) throw new Error(res.error)
    expect(stockOf(f.variants.sneakers40.id)).toBe(before - 2)

    expect(setOrderStatus(db, res.order.id, 'cancelled')).toEqual({ ok: true })
    expect(stockOf(f.variants.sneakers40.id)).toBe(before)
    expect(setOrderStatus(db, res.order.id, 'cancelled')).toEqual({ ok: true })
    expect(stockOf(f.variants.sneakers40.id)).toBe(before)

    expect(setOrderStatus(db, res.order.id, 'new')).toEqual({ ok: false, error: 'Отменённый заказ нельзя вернуть — оформите новый' })
    expect(listOrders(db)[0].status).toBe('cancelled')
  })

  it('cancel skips items whose product was deleted', () => {
    const customer = { name: 'Анна', phone: '+79001234567', email: 'a@a.ru', address: 'Москва 1', comment: '' }
    const res = createOrder(db, { customer, items: [{ variantId: f.variants.dressS.id, qty: 1 }] })
    if (!res.ok) throw new Error(res.error)
    db.delete(products).where(eq(products.id, f.products.dress.id)).run()
    expect(setOrderStatus(db, res.order.id, 'cancelled')).toEqual({ ok: true })
  })
})
