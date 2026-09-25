import { asc, count, eq } from 'drizzle-orm'
import type { DB } from '@/db'
import { categories, products } from '@/db/schema'
import { slugify } from '@/lib/slug'

type Result = { ok: true } | { ok: false; error: string }

export async function listCategoriesWithCounts(db: DB) {
  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, products: count(products.id) })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.id))
    .all()
}

export async function createCategory(db: DB, name: string): Promise<Result> {
  const clean = name.trim()
  if (clean.length < 2) return { ok: false, error: 'Слишком короткое название' }
  const slug = slugify(clean)
  if (await db.select().from(categories).where(eq(categories.slug, slug)).get()) return { ok: false, error: 'Категория с таким адресом уже есть' }
  await db.insert(categories).values({ name: clean, slug }).run()
  return { ok: true }
}

export async function renameCategory(db: DB, id: number, name: string): Promise<void> {
  const clean = name.trim()
  if (clean.length >= 2) await db.update(categories).set({ name: clean }).where(eq(categories.id, id)).run()
}

export async function deleteCategory(db: DB, id: number): Promise<Result> {
  const n = (await db.select({ n: count() }).from(products).where(eq(products.categoryId, id)).get())?.n ?? 0
  if (n > 0) return { ok: false, error: 'В категории есть товары — сначала перенесите или удалите их' }
  await db.delete(categories).where(eq(categories.id, id)).run()
  return { ok: true }
}
