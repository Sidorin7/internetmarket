import { ProductForm } from '@/components/admin/ProductForm'
import { db } from '@/db/client'
import { getCategories } from '@/features/catalog/queries'
import { isBlobStorage } from '@/lib/uploads'

export default async function NewProductPage() {
  return <ProductForm categories={await getCategories(db)} storage={isBlobStorage() ? 'blob' : 'local'} />
}
