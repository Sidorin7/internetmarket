import { and, asc, count, desc, eq, gt, gte, inArray, lte, sql, type SQL } from 'drizzle-orm'
import type { DB } from '@/db'
import { categories, productImages, products, productVariants } from '@/db/schema'
import { escapeLike, normalizeSearch } from '@/lib/search'
import { sortSizes } from '@/lib/sizes'
import { PAGE_SIZE, type Filters } from './filters'

export type VariantInfo = { id: number; size: string; stock: number }
export type ProductListItem = {
  id: number
  slug: string
  title: string
  price: number
  oldPrice: number | null
  image: string | null
  variants: VariantInfo[]
}
export type ProductDetails = Omit<ProductListItem, 'image'> & {
  description: string
  category: { name: string; slug: string }
  images: string[]
}
export type CartLine = {
  variantId: number
  productId: number
  slug: string
  title: string
  size: string
  price: number
  oldPrice: number | null
  stock: number
  image: string | null
  available: boolean
}

type BaseRow = { id: number; slug: string; title: string; price: number; oldPrice: number | null }

const baseColumns = {
  id: products.id,
  slug: products.slug,
  title: products.title,
  price: products.price,
  oldPrice: products.oldPrice,
}

function variantsByProduct(db: DB, ids: number[]): Map<number, VariantInfo[]> {
  const map = new Map<number, VariantInfo[]>()
  if (!ids.length) return map
  const rows = db
    .select({ id: productVariants.id, productId: productVariants.productId, size: productVariants.size, stock: productVariants.stock })
    .from(productVariants)
    .where(inArray(productVariants.productId, ids))
    .all()
  for (const r of rows) {
    const list = map.get(r.productId) ?? []
    list.push({ id: r.id, size: r.size, stock: r.stock })
    map.set(r.productId, list)
  }
  for (const [id, list] of map) {
    const order = sortSizes(list.map((v) => v.size))
    map.set(id, list.sort((a, b) => order.indexOf(a.size) - order.indexOf(b.size)))
  }
  return map
}

function imagesByProduct(db: DB, ids: number[]): Map<number, string[]> {
  const map = new Map<number, string[]>()
  if (!ids.length) return map
  const rows = db
    .select({ productId: productImages.productId, url: productImages.url })
    .from(productImages)
    .where(inArray(productImages.productId, ids))
    .orderBy(asc(productImages.sort), asc(productImages.id))
    .all()
  for (const r of rows) map.set(r.productId, [...(map.get(r.productId) ?? []), r.url])
  return map
}

function attachMedia(db: DB, rows: BaseRow[]): ProductListItem[] {
  const ids = rows.map((r) => r.id)
  const images = imagesByProduct(db, ids)
  const variants = variantsByProduct(db, ids)
  return rows.map((r) => ({ ...r, image: images.get(r.id)?.[0] ?? null, variants: variants.get(r.id) ?? [] }))
}

export function getCategories(db: DB) {
  return db.select().from(categories).orderBy(asc(categories.id)).all()
}

export function getCategoryBySlug(db: DB, slug: string) {
  return db.select().from(categories).where(eq(categories.slug, slug)).get() ?? null
}

export function getProducts(db: DB, f: Filters) {
  const conds: SQL[] = [eq(products.isActive, true)]
  if (f.category) {
    const cat = getCategoryBySlug(db, f.category)
    if (!cat) return { items: [], total: 0, hasMore: false }
    conds.push(eq(products.categoryId, cat.id))
  }
  if (f.q) conds.push(sql`${products.search} like ${`%${escapeLike(normalizeSearch(f.q))}%`} escape '\\'`)
  if (f.minPrice !== undefined) conds.push(gte(products.price, f.minPrice))
  if (f.maxPrice !== undefined) conds.push(lte(products.price, f.maxPrice))
  if (f.size) {
    conds.push(
      inArray(
        products.id,
        db
          .select({ id: productVariants.productId })
          .from(productVariants)
          .where(and(eq(productVariants.size, f.size), gt(productVariants.stock, 0))),
      ),
    )
  }
  const where = and(...conds)
  const orderBy =
    f.sort === 'cheap'
      ? [asc(products.price), desc(products.id)]
      : f.sort === 'expensive'
        ? [desc(products.price), desc(products.id)]
        : [desc(products.createdAt), desc(products.id)]

  const rows = db.select(baseColumns).from(products).where(where).orderBy(...orderBy).limit(f.page * PAGE_SIZE).all()
  const total = db.select({ n: count() }).from(products).where(where).get()?.n ?? 0
  return { items: attachMedia(db, rows), total, hasMore: total > rows.length }
}

export function getProductBySlug(db: DB, slug: string): ProductDetails | null {
  const row = db
    .select({ ...baseColumns, description: products.description, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .get()
  if (!row) return null
  const { categoryName, categorySlug, ...rest } = row
  return {
    ...rest,
    category: { name: categoryName, slug: categorySlug },
    images: imagesByProduct(db, [row.id]).get(row.id) ?? [],
    variants: variantsByProduct(db, [row.id]).get(row.id) ?? [],
  }
}

export function getAvailableSizes(db: DB, categorySlug?: string): string[] {
  const conds: SQL[] = [eq(products.isActive, true), gt(productVariants.stock, 0)]
  if (categorySlug) {
    const cat = getCategoryBySlug(db, categorySlug)
    if (!cat) return []
    conds.push(eq(products.categoryId, cat.id))
  }
  const rows = db
    .selectDistinct({ size: productVariants.size })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(...conds))
    .all()
  return sortSizes(rows.map((r) => r.size))
}

export function getProductsByIds(db: DB, ids: number[]): ProductListItem[] {
  if (!ids.length) return []
  const rows = db.select(baseColumns).from(products).where(and(inArray(products.id, ids), eq(products.isActive, true))).all()
  const byId = new Map(attachMedia(db, rows).map((p) => [p.id, p]))
  return ids.flatMap((id) => byId.get(id) ?? [])
}

export function getCartLines(db: DB, variantIds: number[]): CartLine[] {
  if (!variantIds.length) return []
  const rows = db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      slug: products.slug,
      title: products.title,
      size: productVariants.size,
      price: products.price,
      oldPrice: products.oldPrice,
      stock: productVariants.stock,
      isActive: products.isActive,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(inArray(productVariants.id, variantIds))
    .all()
  const images = imagesByProduct(db, [...new Set(rows.map((r) => r.productId))])
  return rows.map(({ isActive, ...r }) => ({
    ...r,
    image: images.get(r.productId)?.[0] ?? null,
    available: isActive && r.stock > 0,
  }))
}
