import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import type { DB } from '@/db'
import { favorites, products } from '@/db/schema'

// столько id принимает getProductsByIdsAction на странице избранного
export const FAVORITES_LIMIT = 100

export async function listFavoriteIds(db: DB, userId: number): Promise<number[]> {
  const rows = await db
    .select({ id: favorites.productId })
    .from(favorites)
    .innerJoin(products, eq(products.id, favorites.productId))
    .where(and(eq(favorites.userId, userId), eq(products.isActive, true)))
    // created_at хранится в секундах — rowid различает добавленные в одну секунду
    .orderBy(desc(favorites.createdAt), desc(sql`"favorites"."rowid"`))
    .limit(FAVORITES_LIMIT)
    .all()
  return rows.map((r) => r.id)
}

export async function syncFavorites(db: DB, userId: number, localIds: number[]): Promise<number[]> {
  const ids = [...new Set(localIds)].slice(0, FAVORITES_LIMIT)
  if (ids.length) {
    const known = await db.select({ id: products.id }).from(products).where(and(inArray(products.id, ids), eq(products.isActive, true))).all()
    if (known.length) await db.insert(favorites).values(known.map((p) => ({ userId, productId: p.id }))).onConflictDoNothing().run()
  }
  return listFavoriteIds(db, userId)
}

export async function setFavorite(db: DB, userId: number, productId: number, on: boolean): Promise<void> {
  if (!on) {
    await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.productId, productId))).run()
    return
  }
  const exists = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).get()
  if (exists) await db.insert(favorites).values({ userId, productId }).onConflictDoNothing().run()
}
