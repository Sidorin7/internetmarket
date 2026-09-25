import { ProductsTable } from '@/components/admin/ProductsTable'
import { db } from '@/db/client'
import { listAdminProducts } from '@/features/admin/products'

export default function AdminProductsPage() {
  return <ProductsTable rows={listAdminProducts(db)} />
}
