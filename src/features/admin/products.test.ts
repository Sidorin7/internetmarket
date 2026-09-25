import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import type { DB } from '@/db'
import { orderItems, productImages, products, productVariants } from '@/db/schema'
import { createOrder } from '@/features/orders/create-order'
import { createTestDb, seedFixture, type Fixture } from '@/test/db'
import { deleteProduct, getAdminProduct, listAdminProducts, productInputSchema, saveProduct, type ProductInput } from './products'

let db: DB
let f: Fixture
beforeEach(() => {
  db = createTestDb()
  f = seedFixture(db)
})

const base = (): ProductInput => ({
  title: 'Худи «Облако»',
  description: 'Тёплое',
  price: 459000,
  oldPrice: null,
  categoryId: f.categories.dresses.id,
  isActive: true,
  variants: [{ size: 'M', stock: 2 }, { size: 'S', stock: 1 }],
  images: ['/uploads/a.jpg', '/uploads/b.jpg'],
})

describe('saveProduct', () => {
  it('creates product with slug, search text, sorted variants and ordered images', () => {
    const id = saveProduct(db, base())
    const p = getAdminProduct(db, id)!
    expect(p.slug).toBe('hudi-oblako')
    expect(db.select().from(products).where(eq(products.id, id)).get()!.search).toBe('худи «облако» теплое')
    expect(p.variants).toEqual([{ size: 'S', stock: 1 }, { size: 'M', stock: 2 }])
    expect(p.images).toEqual(['/uploads/a.jpg', '/uploads/b.jpg'])
  })

  it('makes slug unique', () => {
    saveProduct(db, base())
    const id2 = saveProduct(db, base())
    expect(getAdminProduct(db, id2)!.slug).toBe('hudi-oblako-2')
  })

  it('updates variants in place, keeping ids of existing sizes', () => {
    const id = saveProduct(db, base())
    const before = db.select().from(productVariants).where(eq(productVariants.productId, id)).all()
    const mId = before.find((v) => v.size === 'M')!.id
    saveProduct(db, { ...base(), variants: [{ size: 'M', stock: 9 }, { size: 'L', stock: 3 }], images: ['/uploads/b.jpg'] }, id)
    const after = db.select().from(productVariants).where(eq(productVariants.productId, id)).all()
    expect(after.map((v) => v.size).sort()).toEqual(['L', 'M'])
    expect(after.find((v) => v.size === 'M')).toMatchObject({ id: mId, stock: 9 })
    expect(db.select().from(productImages).where(eq(productImages.productId, id)).all().map((i) => i.url)).toEqual(['/uploads/b.jpg'])
  })

  it('keeps slug when title unchanged on update', () => {
    const id = saveProduct(db, base())
    saveProduct(db, { ...base(), price: 100 }, id)
    expect(getAdminProduct(db, id)!.slug).toBe('hudi-oblako')
  })
})

describe('deleteProduct', () => {
  it('keeps order history snapshot', () => {
    const res = createOrder(db, { customer: { name: 'А', phone: '+79000000000', email: 'a@a.ru', address: 'Москва 1', comment: '' }, items: [{ variantId: f.variants.dressS.id, qty: 1 }] })
    expect(res.ok).toBe(true)
    deleteProduct(db, f.products.dress.id)
    expect(db.select().from(orderItems).get()).toMatchObject({ title: 'Льняное платье', productId: null, variantId: null })
  })
})

describe('listAdminProducts', () => {
  it('includes inactive products with total stock', () => {
    const rows = listAdminProducts(db)
    expect(rows).toHaveLength(3)
    expect(rows.find((r) => r.slug === 'lnyanoe-plate')).toMatchObject({ stock: 4, category: 'Платья', isActive: true })
  })
})

describe('productInputSchema', () => {
  it('converts rubles to kopecks and rejects duplicate sizes', () => {
    const ok = productInputSchema.parse({ title: 'Кепка', description: '', price: '990', oldPrice: '', categoryId: '1', isActive: 'true', variants: [{ size: 'ONE SIZE', stock: 5 }], images: [] })
    expect([ok.price, ok.oldPrice]).toEqual([99000, null])
    const dup = productInputSchema.safeParse({ title: 'Кепка', description: '', price: '990', categoryId: '1', isActive: 'true', variants: [{ size: 'M', stock: 1 }, { size: 'm ', stock: 1 }], images: [] })
    expect(dup.success).toBe(false)
  })
  it('accepts prices formatted with thousand separators and decimal comma', () => {
    const ok = productInputSchema.parse({ title: 'Кепка', description: '', price: '1 990', oldPrice: '2 490,50', categoryId: '1', isActive: 'true', variants: [{ size: 'M', stock: 1 }], images: [] })
    expect([ok.price, ok.oldPrice]).toEqual([199000, 249050])
  })
})
