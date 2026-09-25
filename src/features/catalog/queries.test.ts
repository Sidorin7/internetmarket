import { beforeEach, describe, expect, it } from 'vitest'
import type { DB } from '@/db'
import { createTestDb, insertProduct, seedFixture, type Fixture } from '@/test/db'
import { parseFilters } from './filters'
import {
  getAvailableSizes, getCartLines, getCategories, getProductBySlug, getProducts, getProductsByIds,
} from './queries'

let db: DB
let f: Fixture
beforeEach(async () => {
  db = await createTestDb()
  f = await seedFixture(db)
})

const titles = (r: { items: { title: string }[] }) => r.items.map((i) => i.title)

describe('getProducts', () => {
  it('returns only active products, newest first', async () => {
    expect(titles(await getProducts(db, parseFilters({})))).toEqual(['Кеды белые', 'Льняное платье'])
  })

  it('filters by category slug; unknown category → empty', async () => {
    expect(titles(await getProducts(db, parseFilters({}, 'shoes')))).toEqual(['Кеды белые'])
    expect((await getProducts(db, parseFilters({}, 'nope'))).total).toBe(0)
  })

  it('search is case-insensitive for cyrillic and ё', async () => {
    expect(titles(await getProducts(db, parseFilters({ q: 'ПЛАТЬЕ' })))).toEqual(['Льняное платье'])
    await insertProduct(db, { title: 'Ёлочная игрушка', slug: 'elka', price: 1000, categoryId: f.categories.shoes.id, variants: [['ONE SIZE', 1]] })
    expect(titles(await getProducts(db, parseFilters({ q: 'елочная' })))).toEqual(['Ёлочная игрушка'])
  })

  it('treats % in query literally', async () => {
    expect((await getProducts(db, parseFilters({ q: '%' }))).total).toBe(0)
  })

  it('filters by in-stock size only', async () => {
    expect(titles(await getProducts(db, parseFilters({ size: 'S' })))).toEqual(['Льняное платье'])
    expect((await getProducts(db, parseFilters({ size: 'M' }))).total).toBe(0) // M у платья закончился, скрытое не считается
  })

  it('filters by price range and sorts', async () => {
    expect(titles(await getProducts(db, parseFilters({ max: '3000' })))).toEqual(['Кеды белые'])
    expect(titles(await getProducts(db, parseFilters({ sort: 'expensive' })))).toEqual(['Льняное платье', 'Кеды белые'])
    expect(titles(await getProducts(db, parseFilters({ sort: 'cheap' })))).toEqual(['Кеды белые', 'Льняное платье'])
  })

  it('attaches first image and variants', async () => {
    const dress = (await getProducts(db, parseFilters({ q: 'платье' }))).items[0]
    expect(dress.image).toContain('lnyanoe-plate')
    expect(dress.variants.map((v) => v.size)).toEqual(['S', 'M', 'L'])
  })

  it('paginates cumulatively with hasMore', async () => {
    for (let i = 0; i < 30; i++) {
      await insertProduct(db, { title: `Носки ${i}`, slug: `noski-${i}`, price: 10000, categoryId: f.categories.shoes.id, variants: [['ONE SIZE', 1]] })
    }
    const p1 = await getProducts(db, parseFilters({}))
    expect([p1.items.length, p1.total, p1.hasMore]).toEqual([24, 32, true])
    const p2 = await getProducts(db, parseFilters({ page: '2' }))
    expect([p2.items.length, p2.hasMore]).toEqual([32, false])
  })
})

describe('getProductBySlug', () => {
  it('returns details with category, images and sorted variants', async () => {
    const p = (await getProductBySlug(db, 'lnyanoe-plate'))!
    expect(p.category).toEqual({ name: 'Платья', slug: 'dresses' })
    expect(p.images).toHaveLength(1)
    expect(p.variants.map((v) => [v.size, v.stock])).toEqual([['S', 3], ['M', 0], ['L', 1]])
  })
  it('returns null for inactive or missing', async () => {
    expect(await getProductBySlug(db, 'staroe-plate')).toBeNull()
    expect(await getProductBySlug(db, 'nope')).toBeNull()
  })
})

describe('helpers', () => {
  it('getCategories lists all in insertion order', async () => {
    expect((await getCategories(db)).map((c) => c.slug)).toEqual(['dresses', 'shoes'])
  })
  it('getAvailableSizes returns sorted in-stock sizes of active products', async () => {
    expect(await getAvailableSizes(db)).toEqual(['S', 'L', '40', '41'])
    expect(await getAvailableSizes(db, 'dresses')).toEqual(['S', 'L'])
  })
  it('getProductsByIds keeps requested order and skips inactive', async () => {
    const ids = [f.products.sneakers.id, f.products.hidden.id, f.products.dress.id]
    expect((await getProductsByIds(db, ids)).map((p) => p.title)).toEqual(['Кеды белые', 'Льняное платье'])
    expect(await getProductsByIds(db, [])).toEqual([])
  })
})

describe('getCartLines', () => {
  it('returns current price and stock for variants', async () => {
    const [line] = await getCartLines(db, [f.variants.dressL.id])
    expect(line).toMatchObject({ title: 'Льняное платье', size: 'L', price: 499000, stock: 1, available: true })
  })
  it('getCartLines marks hidden product unavailable and skips unknown ids', async () => {
    const lines = await getCartLines(db, [f.variants.hiddenM.id, f.variants.dressM.id, 99999])
    expect(lines).toHaveLength(2)
    expect(lines.every((l) => !l.available)).toBe(true)
  })
})
