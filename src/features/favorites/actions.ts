'use server'

import { z } from 'zod'
import { db } from '@/db/client'
import { getCurrentUser } from '@/lib/user'
import { FAVORITES_LIMIT, setFavorite, syncFavorites } from './server'

const ids = z.array(z.number().int().positive()).max(FAVORITES_LIMIT)

export async function syncFavoritesAction(localIds: number[]): Promise<number[] | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const parsed = ids.safeParse(Array.isArray(localIds) ? localIds.slice(0, FAVORITES_LIMIT) : [])
  return syncFavorites(db, user.id, parsed.success ? parsed.data : [])
}

export async function setFavoriteAction(productId: number, on: boolean): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  if (Number.isInteger(productId) && productId > 0) await setFavorite(db, user.id, productId, on === true)
  return true
}
