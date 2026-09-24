'use server'

import { z } from 'zod'
import { db } from '@/db/client'
import { getCartLines, getProductsByIds } from './queries'

const ids = z.array(z.number().int().positive()).max(100)

export async function getCartLinesAction(variantIds: number[]) {
  const parsed = ids.safeParse(variantIds)
  return parsed.success ? getCartLines(db, parsed.data) : []
}

export async function getProductsByIdsAction(productIds: number[]) {
  const parsed = ids.safeParse(productIds)
  return parsed.success ? getProductsByIds(db, parsed.data) : []
}
