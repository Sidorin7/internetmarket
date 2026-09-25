import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BuyBox } from '@/components/shop/BuyBox'
import { Gallery } from '@/components/shop/Gallery'
import { db } from '@/db/client'
import { getProductBySlug } from '@/features/catalog/queries'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(db, (await params).slug)
  return product ? { title: product.title, description: product.description.slice(0, 160) } : {}
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(db, (await params).slug)
  if (!product) notFound()
  return (
    <div>
      <nav className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:text-brand-600">Главная</Link> /{' '}
        <Link href={`/catalog/${product.category.slug}`} className="hover:text-brand-600">{product.category.name}</Link>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Gallery images={product.images} title={product.title} />
        <div className="flex flex-col gap-6">
          <h1 className="font-display text-2xl leading-snug font-bold">{product.title}</h1>
          <BuyBox product={product} />
          <section>
            <h2 className="mb-2 font-display text-lg font-bold">Описание</h2>
            <p className="leading-relaxed whitespace-pre-line text-ink/80">{product.description}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
