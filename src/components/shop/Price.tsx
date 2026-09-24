import { discountPercent, formatPrice } from '@/lib/money'

export function Price({ price, oldPrice, size = 'sm' }: { price: number; oldPrice: number | null; size?: 'sm' | 'lg' }) {
  const discount = discountPercent(price, oldPrice)
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-display font-bold ${discount ? 'text-coral-500' : 'text-ink'} ${size === 'lg' ? 'text-3xl' : 'text-lg'}`}>
        {formatPrice(price)}
      </span>
      {discount && oldPrice && (
        <span className={`text-muted line-through ${size === 'lg' ? 'text-base' : 'text-xs'}`}>{formatPrice(oldPrice)}</span>
      )}
    </div>
  )
}
