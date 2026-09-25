import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CatalogView } from '@/components/shop/CatalogView'
import { db } from '@/db/client'
import { parseFilters, type RawParams } from '@/features/catalog/filters'
import { getAvailableSizes, getCategoryBySlug, getProducts } from '@/features/catalog/queries'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawParams> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug(db, (await params).slug)
  return category ? { title: category.name } : {}
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const category = await getCategoryBySlug(db, slug)
  if (!category) notFound()
  const raw = await searchParams
  const filters = parseFilters(raw, slug)
  return (
    <CatalogView
      title={category.name}
      basePath={`/catalog/${slug}`}
      params={raw}
      filters={filters}
      sizes={await getAvailableSizes(db, slug)}
      result={await getProducts(db, filters)}
    />
  )
}
