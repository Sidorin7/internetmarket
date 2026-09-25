import { ProductForm } from '@/components/admin/ProductForm'
import { db } from '@/db/client'
import { getCategories } from '@/features/catalog/queries'

export default function NewProductPage() {
  return <ProductForm categories={getCategories(db)} />
}
