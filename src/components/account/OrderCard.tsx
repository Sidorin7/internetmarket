import Link from 'next/link'
import type { AccountOrder } from '@/features/account/orders'
import { formatDate } from '@/features/account/status'
import { formatPrice } from '@/lib/money'
import { StatusBadge } from './StatusBadge'

export function OrderCard({ order }: { order: AccountOrder }) {
  const preview = order.items.map((i) => `${i.title} (${i.size}) × ${i.qty}`).join(', ')
  return (
    <Link href={`/account/orders/${order.number}`} className="block rounded-card border border-line p-5 transition hover:border-brand-500">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-lg font-bold">Заказ №{order.number}</span>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted">от {formatDate(order.createdAt)}</p>
      <p className="mt-3 line-clamp-2 text-sm">{preview}</p>
      <p className="mt-3 font-display text-lg font-bold">{formatPrice(order.total)}</p>
    </Link>
  )
}
