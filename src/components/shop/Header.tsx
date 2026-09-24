import Link from 'next/link'
import { Suspense } from 'react'
import { SHOP_NAME } from '@/lib/config'
import { HeaderCounters } from './HeaderCounters'
import { SearchBox } from './SearchBox'

export function Header({ categories }: { categories: { slug: string; name: string }[] }) {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-brand-700 via-brand-500 to-[#8a3ff0] shadow-lg shadow-brand-700/20">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:gap-8">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-tight text-white">
          {SHOP_NAME}
        </Link>
        <Suspense fallback={<div className="h-11 flex-1 rounded-2xl bg-white/80" />}>
          <SearchBox />
        </Suspense>
        <HeaderCounters />
      </div>
      <nav className="scrollbar-none mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 pb-2.5 text-sm font-medium whitespace-nowrap text-white/85">
        {categories.map((c) => (
          <Link key={c.slug} href={`/catalog/${c.slug}`} className="hover:text-white">
            {c.name}
          </Link>
        ))}
      </nav>
    </header>
  )
}
