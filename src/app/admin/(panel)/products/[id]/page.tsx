import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/ProductForm'
import { db } from '@/db/client'
import { getAdminProduct } from '@/features/admin/products'
import { getCategories } from '@/features/catalog/queries'
import { isBlobStorage } from '@/lib/uploads'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = await getAdminProduct(db, Number((await params).id))
  if (!product) notFound()
  return <ProductForm categories={await getCategories(db)} initial={product} storage={isBlobStorage() ? 'blob' : 'local'} />
}
