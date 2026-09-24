import Link from 'next/link'

export function CategoryChips({ categories, active }: { categories: { slug: string; name: string }[]; active?: string }) {
  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/catalog/${c.slug}`}
          className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
            c.slug === active ? 'bg-brand-500 text-white' : 'bg-surface text-ink hover:bg-brand-50 hover:text-brand-600'
          }`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  )
}
