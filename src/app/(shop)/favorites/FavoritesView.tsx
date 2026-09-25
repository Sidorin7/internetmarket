'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { getProductsByIdsAction } from '@/features/catalog/actions'
import type { ProductListItem } from '@/features/catalog/queries'
import { useFavorites } from '@/features/favorites/store'
import { useHydrated } from '@/lib/use-hydrated'

export function FavoritesView() {
  const hydrated = useHydrated()
  const ids = useFavorites((s) => s.ids)
  const [items, setItems] = useState<ProductListItem[] | null>(null)
  const key = ids.join(',')

  useEffect(() => {
    if (!hydrated) return
    let cancelled = false
    getProductsByIdsAction(key ? key.split(',').map(Number) : []).then((res) => !cancelled && setItems(res))
    return () => { cancelled = true }
  }, [hydrated, key])

  if (!hydrated || items === null) return <div className="h-64 animate-pulse rounded-card bg-surface" />
  const visible = items.filter((p) => ids.includes(p.id))
  if (!visible.length) {
    return (
      <div className="rounded-card bg-surface p-12 text-center">
        <p className="font-display text-xl font-bold">Здесь будут товары, которые вам понравились</p>
        <Link href="/" className="mt-4 inline-block rounded-2xl bg-brand-500 px-6 py-3 font-semibold text-white">Смотреть ленту</Link>
      </div>
    )
  }
  return <ProductGrid items={visible} />
}
