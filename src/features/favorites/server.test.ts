import { beforeEach, expect, it } from 'vitest'
import type { DB } from '@/db'
import { users } from '@/db/schema'
import { createTestDb, insertProduct, seedFixture, type Fixture } from '@/test/db'
import { FAVORITES_LIMIT, listFavoriteIds, setFavorite, syncFavorites } from './server'

let db: DB
let f: Fixture
let userId: number
beforeEach(async () => {
  db = await createTestDb()
  f = await seedFixture(db)
  userId = (await db.insert(users).values({ email: 'a@a.ru' }).returning().get()).id
})

it('merges local ids into the server list, skipping unknown and hidden products', async () => {
  await setFavorite(db, userId, f.products.dress.id, true)
  const merged = await syncFavorites(db, userId, [f.products.sneakers.id, f.products.dress.id, f.products.hidden.id, 999999, f.products.sneakers.id])
  expect(merged.sort()).toEqual([f.products.dress.id, f.products.sneakers.id].sort())
})

it('adds and removes a favorite, ignoring unknown products', async () => {
  await setFavorite(db, userId, f.products.dress.id, true)
  await setFavorite(db, userId, f.products.dress.id, true)
  await setFavorite(db, userId, 999999, true)
  expect(await listFavoriteIds(db, userId)).toEqual([f.products.dress.id])
  await setFavorite(db, userId, f.products.dress.id, false)
  expect(await listFavoriteIds(db, userId)).toEqual([])
})

it('lists newest first', async () => {
  await setFavorite(db, userId, f.products.dress.id, true)
  await setFavorite(db, userId, f.products.sneakers.id, true)
  expect(await listFavoriteIds(db, userId)).toEqual([f.products.sneakers.id, f.products.dress.id])
})

it('caps the list', async () => {
  const ids: number[] = []
  for (let i = 0; i < FAVORITES_LIMIT + 5; i++) {
    ids.push((await insertProduct(db, { title: `T${i}`, slug: `t-${i}`, price: 100, categoryId: f.categories.shoes.id, variants: [['M', 1]], images: [] })).product.id)
  }
  expect(await syncFavorites(db, userId, ids)).toHaveLength(FAVORITES_LIMIT)
})
