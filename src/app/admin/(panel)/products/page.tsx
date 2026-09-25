import { ProductsTable } from '@/components/admin/ProductsTable'
import { db } from '@/db/client'
import { listAdminProducts } from '@/features/admin/products'

export default async function AdminProductsPage() {
  return <ProductsTable rows={await listAdminProducts(db)} />
}
