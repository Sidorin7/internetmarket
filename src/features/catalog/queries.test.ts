import { beforeEach, describe, expect, it } from 'vitest'
import type { DB } from '@/db'
import { createTestDb, insertProduct, seedFixture, type Fixture } from '@/test/db'
import { parseFilters } from './filters'
import {
  getAvailableSizes, getCartLines, getCategories, getProductBySlug, getProducts, getProductsByIds,
} from './queries'

let db: DB
let f: Fixture
beforeEach(() => {
  db = createTestDb()
  f = seedFixture(db)
})

const titles = (r: { items: { title: string }[] }) => r.items.map((i) => i.title)

describe('getProducts', () => {
  it('returns only active products, newest first', () => {
    expect(titles(getProducts(db, parseFilters({})))).toEqual(['Кеды белые', 'Льняное платье'])
  })

  it('filters by category slug; unknown category → empty', () => {
    expect(titles(getProducts(db, parseFilters({}, 'shoes')))).toEqual(['Кеды белые'])
    expect(getProducts(db, parseFilters({}, 'nope')).total).toBe(0)
  })

  it('search is case-insensitive for cyrillic and ё', () => {
    expect(titles(getProducts(db, parseFilters({ q: 'ПЛАТЬЕ' })))).toEqual(['Льняное платье'])
    insertProduct(db, { title: 'Ёлочная игрушка', slug: 'elka', price: 1000, categoryId: f.categories.shoes.id, variants: [['ONE SIZE', 1]] })
    expect(titles(getProducts(db, parseFilters({ q: 'елочная' })))).toEqual(['Ёлочная игрушка'])
  })

  it('treats % in query literally', () => {
    expect(getProducts(db, parseFilters({ q: '%' })).total).toBe(0)
  })

  it('filters by in-stock size only', () => {
    expect(titles(getProducts(db, parseFilters({ size: 'S' })))).toEqual(['Льняное платье'])
    expect(getProducts(db, parseFilters({ size: 'M' })).total).toBe(0) // M у платья закончился, скрытое не считается
  })

  it('filters by price range and sorts', () => {
    expect(titles(getProducts(db, parseFilters({ max: '3000' })))).toEqual(['Кеды белые'])
    expect(titles(getProducts(db, parseFilters({ sort: 'expensive' })))).toEqual(['Льняное платье', 'Кеды белые'])
    expect(titles(getProducts(db, parseFilters({ sort: 'cheap' })))).toEqual(['Кеды белые', 'Льняное платье'])
  })

  it('attaches first image and variants', () => {
    const dress = getProducts(db, parseFilters({ q: 'платье' })).items[0]
    expect(dress.image).toContain('lnyanoe-plate')
    expect(dress.variants.map((v) => v.size)).toEqual(['S', 'M', 'L'])
  })

  it('paginates cumulatively with hasMore', () => {
    for (let i = 0; i < 30; i++) {
      insertProduct(db, { title: `Носки ${i}`, slug: `noski-${i}`, price: 10000, categoryId: f.categories.shoes.id, variants: [['ONE SIZE', 1]] })
    }
    const p1 = getProducts(db, parseFilters({}))
    expect([p1.items.length, p1.total, p1.hasMore]).toEqual([24, 32, true])
    const p2 = getProducts(db, parseFilters({ page: '2' }))
    expect([p2.items.length, p2.hasMore]).toEqual([32, false])
  })
})

describe('getProductBySlug', () => {
  it('returns details with category, images and sorted variants', () => {
    const p = getProductBySlug(db, 'lnyanoe-plate')!
    expect(p.category).toEqual({ name: 'Платья', slug: 'dresses' })
    expect(p.images).toHaveLength(1)
    expect(p.variants.map((v) => [v.size, v.stock])).toEqual([['S', 3], ['M', 0], ['L', 1]])
  })
  it('returns null for inactive or missing', () => {
    expect(getProductBySlug(db, 'staroe-plate')).toBeNull()
    expect(getProductBySlug(db, 'nope')).toBeNull()
  })
})

describe('helpers', () => {
  it('getCategories lists all in insertion order', () => {
    expect(getCategories(db).map((c) => c.slug)).toEqual(['dresses', 'shoes'])
  })
  it('getAvailableSizes returns sorted in-stock sizes of active products', () => {
    expect(getAvailableSizes(db)).toEqual(['S', 'L', '40', '41'])
    expect(getAvailableSizes(db, 'dresses')).toEqual(['S', 'L'])
  })
  it('getProductsByIds keeps requested order and skips inactive', () => {
    const ids = [f.products.sneakers.id, f.products.hidden.id, f.products.dress.id]
    expect(getProductsByIds(db, ids).map((p) => p.title)).toEqual(['Кеды белые', 'Льняное платье'])
    expect(getProductsByIds(db, [])).toEqual([])
  })
})

describe('getCartLines', () => {
  it('returns current price and stock for variants', () => {
    const [line] = getCartLines(db, [f.variants.dressL.id])
    expect(line).toMatchObject({ title: 'Льняное платье', size: 'L', price: 499000, stock: 1, available: true })
  })
  it('getCartLines marks hidden product unavailable and skips unknown ids', () => {
    const lines = getCartLines(db, [f.variants.hiddenM.id, f.variants.dressM.id, 99999])
    expect(lines).toHaveLength(2)
    expect(lines.every((l) => !l.available)).toBe(true)
  })
})
