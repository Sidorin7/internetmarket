'use client'

import Link from 'next/link'
import { Heart, ShoppingBag, UserRound } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { selectCartCount, useCart } from '@/features/cart/store'
import { useFavorites } from '@/features/favorites/store'
import { useHydrated } from '@/lib/use-hydrated'

function Badge({ value }: { value: number }) {
  return (
    <AnimatePresence>
      {value > 0 && (
        <motion.span
          key={value}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className="absolute -top-1.5 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[11px] font-bold text-white"
        >
          {value}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

export function HeaderCounters() {
  const hydrated = useHydrated()
  const cartCount = useCart(selectCartCount)
  const favCount = useFavorites((s) => s.ids.length)
  const item = 'relative flex flex-col items-center gap-0.5 text-[11px] font-medium text-white/90 hover:text-white'
  return (
    <nav className="flex items-center gap-5">
      <Link href="/account" className={item}>
        <UserRound className="size-6" />
        <span className="hidden sm:block">Профиль</span>
      </Link>
      <Link href="/favorites" className={item}>
        <span className="relative">
          <Heart className="size-6" />
          <Badge value={hydrated ? favCount : 0} />
        </span>
        <span className="hidden sm:block">Избранное</span>
      </Link>
      <Link href="/cart" className={item}>
        <span className="relative">
          <ShoppingBag className="size-6" />
          <Badge value={hydrated ? cartCount : 0} />
        </span>
        <span className="hidden sm:block">Корзина</span>
      </Link>
    </nav>
  )
}
