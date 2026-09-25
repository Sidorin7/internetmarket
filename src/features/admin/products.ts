import { and, asc, desc, eq, inArray, ne, notInArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { DB, Tx } from '@/db'
import { categories, productImages, products, productVariants } from '@/db/schema'
import { buildSearchText } from '@/lib/search'
import { sortSizes } from '@/lib/sizes'
import { slugify } from '@/lib/slug'

// NumberInput с thousandSeparator отправляет «1 990», а пользователь может ввести «99,50»
const normalizeNumber = (v: unknown) => (typeof v === 'string' ? v.replace(/\s/g, '').replace(',', '.') : v)

const rubles = z
  .preprocess(normalizeNumber, z.coerce.number({ error: 'Укажите цену числом' }))
  .pipe(z.number().positive('Цена должна быть больше 0').max(10_000_000))
  .transform((r) => Math.round(r * 100))

export const productInputSchema = z.object({
  title: z.string().trim().min(2, 'Слишком короткое название').max(200),
  description: z.string().trim().max(5000).default(''),
  price: rubles,
  oldPrice: z.preprocess((v) => (v === '' || v === null || v === undefined ? null : v), rubles.nullable()),
  categoryId: z.coerce.number().int().positive('Выберите категорию'),
  isActive: z.preprocess((v) => v === true || v === 'true' || v === 'on', z.boolean()),
  variants: z
    .array(z.object({ size: z.string().trim().toUpperCase().min(1).max(20), stock: z.coerce.number().int().min(0).max(100000) }))
    .min(1, 'Добавьте хотя бы один размер')
    .refine((vs) => new Set(vs.map((v) => v.size)).size === vs.length, 'Размеры не должны повторяться'),
  images: z.array(z.string().max(500)).max(20).default([]),
})

export type ProductInput = z.output<typeof productInputSchema>

async function uniqueSlug(db: DB | Tx, base: string, excludeId?: number): Promise<string> {
  let slug = base
  for (let n = 2; ; n++) {
    const clash = await db
      .select({ id: products.id })
      .from(products)
      .where(excludeId ? and(eq(products.slug, slug), ne(products.id, excludeId)) : eq(products.slug, slug))
      .get()
    if (!clash) return slug
    slug = `${base}-${n}`
  }
}

export async function saveProduct(db: DB, input: ProductInput, id?: number): Promise<number> {
  return db.transaction(async (tx) => {
    const fields = {
      title: input.title,
      description: input.description,
      search: buildSearchText(input.title, input.description),
      price: input.price,
      oldPrice: input.oldPrice,
      categoryId: input.categoryId,
      isActive: input.isActive,
    }
    let productId: number
    if (id) {
      const current = await tx.select({ title: products.title, slug: products.slug }).from(products).where(eq(products.id, id)).get()
      if (!current) throw new Error(`Product ${id} not found`)
      const slug = current.title === input.title ? current.slug : await uniqueSlug(tx, slugify(input.title), id)
      await tx.update(products).set({ ...fields, slug }).where(eq(products.id, id)).run()
      productId = id
    } else {
      productId = (await tx.insert(products).values({ ...fields, slug: await uniqueSlug(tx, slugify(input.title)) }).returning({ id: products.id }).get()).id
    }

    const sizes = input.variants.map((v) => v.size)
    await tx.delete(productVariants).where(and(eq(productVariants.productId, productId), notInArray(productVariants.size, sizes))).run()
    for (const v of input.variants) {
      await tx.insert(productVariants)
        .values({ productId, size: v.size, stock: v.stock })
        .onConflictDoUpdate({ target: [productVariants.productId, productVariants.size], set: { stock: v.stock } })
        .run()
    }

    await tx.delete(productImages).where(eq(productImages.productId, productId)).run()
    if (input.images.length) {
      await tx.insert(productImages).values(input.images.map((url, sort) => ({ productId, url, sort }))).run()
    }
    return productId
  })
}

export async function deleteProduct(db: DB, id: number): Promise<void> {
  await db.delete(products).where(eq(products.id, id)).run()
}

export async function listAdminProducts(db: DB) {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      title: products.title,
      price: products.price,
      isActive: products.isActive,
      category: categories.name,
      stock: sql<number>`coalesce((select sum(${productVariants.stock}) from ${productVariants} where ${productVariants.productId} = ${products.id}), 0)`,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .orderBy(desc(products.id))
    .all()
  const ids = rows.map((r) => r.id)
  const firstImage = new Map<number, string>()
  if (ids.length) {
    for (const img of await db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.sort)).all()) {
      if (!firstImage.has(img.productId)) firstImage.set(img.productId, img.url)
    }
  }
  return rows.map((r) => ({ ...r, image: firstImage.get(r.id) ?? null }))
}

export async function getAdminProduct(db: DB, id: number) {
  const p = await db.select().from(products).where(eq(products.id, id)).get()
  if (!p) return null
  const variants = await db.select({ size: productVariants.size, stock: productVariants.stock }).from(productVariants).where(eq(productVariants.productId, id)).all()
  const order = sortSizes(variants.map((v) => v.size))
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    price: p.price,
    oldPrice: p.oldPrice,
    categoryId: p.categoryId,
    isActive: p.isActive,
    variants: variants.sort((a, b) => order.indexOf(a.size) - order.indexOf(b.size)),
    images: (await db.select({ url: productImages.url }).from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sort)).all()).map((i) => i.url),
  }
}
