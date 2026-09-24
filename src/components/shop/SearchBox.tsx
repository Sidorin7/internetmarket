'use client'

import { Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export function SearchBox() {
  const q = useSearchParams().get('q') ?? ''
  return (
    <form action="/search" role="search" className="relative flex-1">
      <input
        key={q}
        name="q"
        defaultValue={q}
        placeholder="Искать платья, кеды, худи…"
        className="h-11 w-full rounded-2xl border-0 bg-white pr-12 pl-4 text-ink shadow-sm outline-none placeholder:text-muted focus:ring-4 focus:ring-brand-200"
      />
      <button type="submit" aria-label="Найти" className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-xl bg-brand-500 text-white hover:bg-brand-600">
        <Search className="size-4" />
      </button>
    </form>
  )
}
