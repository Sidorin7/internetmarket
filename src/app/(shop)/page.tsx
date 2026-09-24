import { CategoryChips } from '@/components/shop/CategoryChips'
import { LoadMore } from '@/components/shop/LoadMore'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { db } from '@/db/client'
import { buildQuery, parseFilters, type RawParams } from '@/features/catalog/filters'
import { getCategories, getProducts } from '@/features/catalog/queries'

export default async function Home({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams
  const filters = parseFilters(params)
  const { items, total, hasMore } = getProducts(db, filters)
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-brand-500 to-coral-500 px-6 py-10 text-white sm:px-12 sm:py-14">
        <p className="text-sm font-semibold tracking-widest uppercase opacity-80">Новая коллекция</p>
        <h1 className="mt-2 max-w-xl font-display text-3xl leading-tight font-extrabold sm:text-5xl">Без наценки маркетплейса</h1>
        <p className="mt-3 max-w-md text-white/85">Покупайте напрямую у производителя — те же вещи, честная цена.</p>
        <div className="absolute -right-10 -bottom-16 size-64 rounded-full bg-white/15 blur-2xl" />
      </section>
      <CategoryChips categories={getCategories(db)} />
      <ProductGrid items={items} />
      {hasMore && <LoadMore href={`/${buildQuery(params, { page: filters.page + 1 })}`} shown={items.length} total={total} />}
    </div>
  )
}
