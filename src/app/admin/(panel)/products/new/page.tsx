import { ProductForm } from '@/components/admin/ProductForm'
import { db } from '@/db/client'
import { getCategories } from '@/features/catalog/queries'

export default async function NewProductPage() {
  return <ProductForm categories={await getCategories(db)} />
}
