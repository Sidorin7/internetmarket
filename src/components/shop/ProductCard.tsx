'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check, Heart } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import type { ProductListItem } from '@/features/catalog/queries'
import { useCart } from '@/features/cart/store'
import { useFavorites } from '@/features/favorites/store'
import { discountPercent } from '@/lib/money'
import { useHydrated } from '@/lib/use-hydrated'
import { Price } from './Price'

export function ProductCard({ item }: { item: ProductListItem }) {
  const hydrated = useHydrated()
  const isFav = useFavorites((s) => s.ids.includes(item.id))
  const toggleFav = useFavorites((s) => s.toggle)
  const add = useCart((s) => s.add)
  const [added, setAdded] = useState(false)

  const inStock = item.variants.filter((v) => v.stock > 0)
  const single = inStock.length === 1 ? inStock[0] : null
  const discount = discountPercent(item.price, item.oldPrice)

  function quickAdd() {
    if (!single) return
    add({ variantId: single.id, productId: item.id }, 1, single.stock)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <motion.article whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="group flex flex-col rounded-card p-2 hover:shadow-card">
      <Link href={`/product/${item.slug}`} className="relative block aspect-[3/4] overflow-hidden rounded-[1rem] bg-surface">
        {item.image && (
          <Image src={item.image} alt={item.title} fill sizes="(min-width:1280px) 20vw, (min-width:640px) 33vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
        )}
        {discount && <span className="absolute top-2 left-2 rounded-lg bg-coral-500 px-2 py-1 text-xs font-bold text-white">−{discount}%</span>}
        {inStock.length === 0 && <span className="absolute inset-x-2 bottom-2 rounded-lg bg-ink/80 py-1 text-center text-xs font-semibold text-white">Нет в наличии</span>}
      </Link>
      <motion.button
        type="button"
        whileTap={{ scale: 0.8 }}
        onClick={() => toggleFav(item.id)}
        aria-label={isFav ? 'Убрать из избранного' : 'В избранное'}
        className="relative z-10 -mt-11 mr-2 ml-auto grid size-9 place-items-center rounded-full bg-white/90 shadow"
      >
        <Heart className={`size-5 ${hydrated && isFav ? 'fill-coral-500 text-coral-500' : 'text-ink'}`} />
      </motion.button>
      <div className="mt-3 flex flex-1 flex-col gap-1 px-1">
        <Price price={item.price} oldPrice={item.oldPrice} />
        <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm text-ink/80 hover:text-brand-600">
          {item.title}
        </Link>
        <div className="mt-auto pt-2">
          {single ? (
            <button type="button" onClick={quickAdd} className="flex h-9 w-full items-center justify-center gap-1 rounded-xl bg-brand-500 text-sm font-semibold text-white transition hover:bg-brand-600">
              {added ? <><Check className="size-4" /> В корзине</> : 'В корзину'}
            </button>
          ) : (
            <Link href={`/product/${item.slug}`} className={`flex h-9 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${inStock.length ? 'bg-brand-50 text-brand-600 hover:bg-brand-100' : 'bg-surface text-muted'}`}>
              {inStock.length ? 'Выбрать размер' : 'Подробнее'}
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  )
}
