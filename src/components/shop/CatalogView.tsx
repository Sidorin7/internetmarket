import type { Filters as F, RawParams } from '@/features/catalog/filters'
import { buildQuery } from '@/features/catalog/filters'
import type { ProductListItem } from '@/features/catalog/queries'
import { Filters } from './Filters'
import { LoadMore } from './LoadMore'
import { ProductGrid } from './ProductGrid'

type Props = {
  title: string
  basePath: string
  params: RawParams
  filters: F
  sizes: string[]
  result: { items: ProductListItem[]; total: number; hasMore: boolean }
}

export function CatalogView({ title, basePath, params, filters, sizes, result }: Props) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {title} <span className="text-base font-medium text-muted">{result.total}</span>
        </h1>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <Filters sizes={sizes} filters={filters} action={basePath} />
        <div className="flex-1">
          {result.items.length ? (
            <ProductGrid items={result.items} />
          ) : (
            <div className="rounded-card bg-surface p-10 text-center">
              <p className="font-display text-lg font-bold">Ничего не нашлось</p>
              <p className="mt-1 text-muted">Попробуйте изменить запрос или сбросить фильтры</p>
            </div>
          )}
          {result.hasMore && <LoadMore href={`${basePath}${buildQuery(params, { page: filters.page + 1 })}`} shown={result.items.length} total={result.total} />}
        </div>
      </div>
    </div>
  )
}
