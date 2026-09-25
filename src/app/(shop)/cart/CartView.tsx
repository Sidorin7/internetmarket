'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { getCartLinesAction } from '@/features/catalog/actions'
import type { CartLine } from '@/features/catalog/queries'
import { missingVariantIds, useCart } from '@/features/cart/store'
import { formatPrice } from '@/lib/money'
import { useHydrated } from '@/lib/use-hydrated'

export function useCartLines() {
  const hydrated = useHydrated()
  const items = useCart((s) => s.items)
  const [lines, setLines] = useState<CartLine[] | null>(null)
  const idsKey = items.map((i) => i.variantId).join(',')

  useEffect(() => {
    if (!hydrated) return
    let cancelled = false
    const ids = idsKey ? idsKey.split(',').map(Number) : []
    getCartLinesAction(ids).then((res) => {
      if (cancelled) return
      const missing = missingVariantIds(ids, res)
      if (missing.length) useCart.getState().removeMany(missing)
      setLines(res)
    })
    return () => { cancelled = true }
  }, [hydrated, idsKey])

  const byId = new Map((lines ?? []).map((l) => [l.variantId, l]))
  return {
    loading: !hydrated || lines === null,
    lines: items.flatMap((i) => {
      const line = byId.get(i.variantId)
      return line ? [{ ...line, qty: Math.min(i.qty, Math.max(line.stock, 1)) }] : []
    }),
  }
}

export function CartView() {
  const { lines, loading } = useCartLines()
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)

  if (loading) return <div className="h-64 animate-pulse rounded-card bg-surface" />
  if (!lines.length) {
    return (
      <div className="rounded-card bg-surface p-12 text-center">
        <p className="font-display text-xl font-bold">В корзине пока пусто</p>
        <Link href="/" className="mt-4 inline-block rounded-2xl bg-brand-500 px-6 py-3 font-semibold text-white">Перейти к покупкам</Link>
      </div>
    )
  }

  const available = lines.filter((l) => l.available)
  const total = available.reduce((s, l) => s + l.price * l.qty, 0)
  const saved = available.reduce((s, l) => s + Math.max(0, (l.oldPrice ?? l.price) - l.price) * l.qty, 0)
  const count = available.reduce((s, l) => s + l.qty, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <motion.li key={l.variantId} layout exit={{ opacity: 0, x: -40 }} className={`flex gap-4 rounded-card border border-line p-3 ${l.available ? '' : 'opacity-60'}`}>
              <Link href={`/product/${l.slug}`} className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                {l.image && <Image src={l.image} alt="" fill sizes="80px" className="object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col gap-1">
                <Link href={`/product/${l.slug}`} className="text-sm font-medium hover:text-brand-600">{l.title}</Link>
                <p className="text-xs text-muted">Размер: {l.size}</p>
                {!l.available && <p className="text-xs font-semibold text-coral-600">Товар закончился или снят с продажи</p>}
                <div className="mt-auto flex items-center justify-between gap-2">
                  {l.available ? (
                    <div className="flex items-center rounded-xl bg-surface">
                      <button type="button" aria-label="Меньше" onClick={() => setQty(l.variantId, l.qty - 1, l.stock)} className="grid size-9 place-items-center"><Minus className="size-4" /></button>
                      <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                      <button type="button" aria-label="Больше" disabled={l.qty >= l.stock} onClick={() => setQty(l.variantId, l.qty + 1, l.stock)} className="grid size-9 place-items-center disabled:opacity-30"><Plus className="size-4" /></button>
                    </div>
                  ) : <span />}
                  <span className="font-display font-bold">{formatPrice(l.price * l.qty)}</span>
                  <button type="button" aria-label="Удалить" onClick={() => remove(l.variantId)} className="text-muted hover:text-coral-600"><Trash2 className="size-5" /></button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <aside className="h-fit rounded-card bg-surface p-5 lg:sticky lg:top-32">
        <div className="flex justify-between text-sm"><span>Товары, {count} шт.</span><span>{formatPrice(total + saved)}</span></div>
        {saved > 0 && <div className="mt-1 flex justify-between text-sm text-coral-600"><span>Скидка</span><span>−{formatPrice(saved)}</span></div>}
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-display text-lg font-bold">Итого</span>
          <span className="font-display text-2xl font-bold">{formatPrice(total)}</span>
        </div>
        {available.length ? (
          <Link href="/checkout" className="mt-5 flex h-12 items-center justify-center rounded-2xl bg-brand-500 font-semibold text-white hover:bg-brand-600">Оформить заказ</Link>
        ) : (
          <p className="mt-5 text-sm text-muted">Нет товаров, доступных к заказу</p>
        )}
      </aside>
    </div>
  )
}
