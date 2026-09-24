'use client'

import Link from 'next/link'
import { Heart, Truck } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import type { ProductDetails } from '@/features/catalog/queries'
import { useCart } from '@/features/cart/store'
import { useFavorites } from '@/features/favorites/store'
import { useHydrated } from '@/lib/use-hydrated'
import { Price } from './Price'

export function BuyBox({ product }: { product: ProductDetails }) {
  const hydrated = useHydrated()
  const inStock = product.variants.filter((v) => v.stock > 0)
  const [selectedId, setSelectedId] = useState<number | null>(inStock.length === 1 ? inStock[0].id : null)
  const [error, setError] = useState('')
  const inCart = useCart((s) => s.items.some((i) => i.variantId === selectedId))
  const add = useCart((s) => s.add)
  const isFav = useFavorites((s) => s.ids.includes(product.id))
  const toggleFav = useFavorites((s) => s.toggle)
  const selected = product.variants.find((v) => v.id === selectedId)

  function addToCart() {
    if (!selected) return setError('Выберите размер')
    add({ variantId: selected.id, productId: product.id }, 1, selected.stock)
  }

  return (
    <div className="flex flex-col gap-5 rounded-card border border-line p-5 lg:sticky lg:top-32">
      <Price price={product.price} oldPrice={product.oldPrice} size="lg" />
      <div>
        <p className="mb-2 text-sm font-semibold">Размер</p>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={v.stock === 0}
              onClick={() => { setSelectedId(v.id); setError('') }}
              className={`min-w-12 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:line-through ${
                v.id === selectedId ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line hover:border-brand-200'
              }`}
            >
              {v.size}
            </button>
          ))}
        </div>
        {selected && selected.stock <= 3 && <p className="mt-2 text-sm font-medium text-coral-600">Осталось {selected.stock} шт.</p>}
        {error && <p className="mt-2 text-sm font-medium text-coral-600">{error}</p>}
      </div>
      <div className="flex gap-2">
        {hydrated && inCart ? (
          <Link href="/cart" className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-brand-50 font-semibold text-brand-700 hover:bg-brand-100">
            Перейти в корзину
          </Link>
        ) : (
          <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={addToCart} disabled={!inStock.length} className="h-12 flex-1 rounded-2xl bg-brand-500 font-semibold text-white hover:bg-brand-600 disabled:bg-surface disabled:text-muted">
            {inStock.length ? 'Добавить в корзину' : 'Нет в наличии'}
          </motion.button>
        )}
        <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => toggleFav(product.id)} aria-label="В избранное" className="grid size-12 place-items-center rounded-2xl bg-surface hover:bg-coral-50">
          <Heart className={`size-6 ${hydrated && isFav ? 'fill-coral-500 text-coral-500' : ''}`} />
        </motion.button>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted">
        <Truck className="size-4" /> Доставка 2–5 дней, оплата при получении
      </p>
    </div>
  )
}
