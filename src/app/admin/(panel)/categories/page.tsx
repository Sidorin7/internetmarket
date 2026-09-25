import { CategoriesManager } from '@/components/admin/CategoriesManager'
import { db } from '@/db/client'
import { listCategoriesWithCounts } from '@/features/admin/categories'

export default async function AdminCategoriesPage() {
  return <CategoriesManager rows={await listCategoriesWithCounts(db)} />
}
