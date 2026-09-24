import path from 'node:path'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { createDb, type DB } from '@/db'
import { categories, productImages, products, productVariants } from '@/db/schema'
import { buildSearchText } from '@/lib/search'

export function createTestDb(): DB {
  const db = createDb(':memory:')
  migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') })
  return db
}

type NewProduct = {
  title: string
  slug: string
  price: number
  oldPrice?: number | null
  categoryId: number
  isActive?: boolean
  variants: [size: string, stock: number][]
  images?: string[]
}

export function insertProduct(db: DB, p: NewProduct) {
  const product = db
    .insert(products)
    .values({
      title: p.title,
      slug: p.slug,
      price: p.price,
      oldPrice: p.oldPrice ?? null,
      categoryId: p.categoryId,
      isActive: p.isActive ?? true,
      search: buildSearchText(p.title, ''),
    })
    .returning()
    .get()
  const variants = p.variants.map(([size, stock]) =>
    db.insert(productVariants).values({ productId: product.id, size, stock }).returning().get(),
  )
  ;(p.images ?? [`https://picsum.photos/seed/${p.slug}/600/800`]).forEach((url, sort) =>
    db.insert(productImages).values({ productId: product.id, url, sort }).run(),
  )
  return { product, variants }
}

export function seedFixture(db: DB) {
  const dresses = db.insert(categories).values({ name: 'Платья', slug: 'dresses' }).returning().get()
  const shoes = db.insert(categories).values({ name: 'Обувь', slug: 'shoes' }).returning().get()

  const dress = insertProduct(db, {
    title: 'Льняное платье',
    slug: 'lnyanoe-plate',
    price: 499000,
    oldPrice: 699000,
    categoryId: dresses.id,
    variants: [['S', 3], ['M', 0], ['L', 1]],
  })
  const sneakers = insertProduct(db, {
    title: 'Кеды белые',
    slug: 'kedy-belye',
    price: 299000,
    categoryId: shoes.id,
    variants: [['40', 5], ['41', 2]],
  })
  const hidden = insertProduct(db, {
    title: 'Старое платье',
    slug: 'staroe-plate',
    price: 100000,
    categoryId: dresses.id,
    isActive: false,
    variants: [['M', 5]],
  })

  const [dressS, dressM, dressL] = dress.variants
  const [sneakers40, sneakers41] = sneakers.variants
  return {
    categories: { dresses, shoes },
    products: { dress: dress.product, sneakers: sneakers.product, hidden: hidden.product },
    variants: { dressS, dressM, dressL, sneakers40, sneakers41, hiddenM: hidden.variants[0] },
  }
}

export type Fixture = ReturnType<typeof seedFixture>
