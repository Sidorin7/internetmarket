import { CategoriesManager } from '@/components/admin/CategoriesManager'
import { db } from '@/db/client'
import { listCategoriesWithCounts } from '@/features/admin/categories'

export default function AdminCategoriesPage() {
  return <CategoriesManager rows={listCategoriesWithCounts(db)} />
}
