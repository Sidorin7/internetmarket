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
beforeEach(async () => {
  db = await createTestDb()
  f = await seedFixture(db)
})

describe('categories', () => {
  it('creates with transliterated unique slug', async () => {
    expect(await createCategory(db, 'Юбки')).toEqual({ ok: true })
    expect(await createCategory(db, 'юбки')).toEqual({ ok: false, error: 'Категория с таким адресом уже есть' })
    expect((await listCategoriesWithCounts(db)).map((c) => [c.slug, c.products])).toEqual([['dresses', 2], ['shoes', 1], ['yubki', 0]])
  })
  it('refuses to delete non-empty category', async () => {
    expect(await deleteCategory(db, f.categories.dresses.id)).toEqual({ ok: false, error: 'В категории есть товары — сначала перенесите или удалите их' })
    await createCategory(db, 'Пустая')
    const empty = (await listCategoriesWithCounts(db)).find((c) => c.slug === 'pustaya')!
    expect(await deleteCategory(db, empty.id)).toEqual({ ok: true })
  })
  it('renames keeping slug', async () => {
    await renameCategory(db, f.categories.shoes.id, 'Кроссовки и кеды')
    expect((await listCategoriesWithCounts(db)).find((c) => c.slug === 'shoes')!.name).toBe('Кроссовки и кеды')
  })
})

describe('orders', () => {
  it('lists newest first with items and updates status', async () => {
    const customer = { name: 'Анна', phone: '+79001234567', email: 'a@a.ru', address: 'Москва 1', comment: '' }
    await createOrder(db, { customer, items: [{ variantId: f.variants.dressS.id, qty: 1 }] })
    await createOrder(db, { customer, items: [{ variantId: f.variants.sneakers40.id, qty: 2 }] })
    const list = await listOrders(db)
    expect(list.map((o) => o.number)).toEqual(['100002', '100001'])
    expect(list[0]).toMatchObject({ status: 'new', emailSent: false, items: [{ title: 'Кеды белые', qty: 2 }] })
    await setOrderStatus(db, list[0].id, 'shipped')
    expect((await listOrders(db))[0].status).toBe('shipped')
  })

  it('returns stock on cancel once and refuses to reopen cancelled order', async () => {
    const customer = { name: 'Анна', phone: '+79001234567', email: 'a@a.ru', address: 'Москва 1', comment: '' }
    const stockOf = async (id: number) => (await db.select().from(productVariants).where(eq(productVariants.id, id)).get())!.stock
    const before = await stockOf(f.variants.sneakers40.id)
    const res = await createOrder(db, { customer, items: [{ variantId: f.variants.sneakers40.id, qty: 2 }] })
    if (!res.ok) throw new Error(res.error)
    expect(await stockOf(f.variants.sneakers40.id)).toBe(before - 2)

    expect(await setOrderStatus(db, res.order.id, 'cancelled')).toEqual({ ok: true })
    expect(await stockOf(f.variants.sneakers40.id)).toBe(before)
    expect(await setOrderStatus(db, res.order.id, 'cancelled')).toEqual({ ok: true })
    expect(await stockOf(f.variants.sneakers40.id)).toBe(before)

    expect(await setOrderStatus(db, res.order.id, 'new')).toEqual({ ok: false, error: 'Отменённый заказ нельзя вернуть — оформите новый' })
    expect((await listOrders(db))[0].status).toBe('cancelled')
  })

  it('cancel skips items whose product was deleted', async () => {
    const customer = { name: 'Анна', phone: '+79001234567', email: 'a@a.ru', address: 'Москва 1', comment: '' }
    const res = await createOrder(db, { customer, items: [{ variantId: f.variants.dressS.id, qty: 1 }] })
    if (!res.ok) throw new Error(res.error)
    await db.delete(products).where(eq(products.id, f.products.dress.id)).run()
    expect(await setOrderStatus(db, res.order.id, 'cancelled')).toEqual({ ok: true })
  })
})
