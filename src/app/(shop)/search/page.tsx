import { CatalogView } from '@/components/shop/CatalogView'
import { db } from '@/db/client'
import { parseFilters, type RawParams } from '@/features/catalog/filters'
import { getAvailableSizes, getProducts } from '@/features/catalog/queries'

export const metadata = { title: 'Поиск' }

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const raw = await searchParams
  const filters = parseFilters(raw)
  return (
    <CatalogView
      title={filters.q ? `«${filters.q}»` : 'Все товары'}
      basePath="/search"
      params={raw}
      filters={filters}
      sizes={await getAvailableSizes(db)}
      result={await getProducts(db, filters)}
    />
  )
}
