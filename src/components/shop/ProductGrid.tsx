import type { ProductListItem } from '@/features/catalog/queries'
import { ProductCard } from './ProductCard'

export function ProductGrid({ items }: { items: ProductListItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <ProductCard key={item.id} item={item} />
      ))}
    </div>
  )
}
