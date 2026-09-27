import type { OrderStatus } from '@/db/schema'
import { STATUS_LABEL } from '@/features/account/status'

const tone: Record<OrderStatus, string> = {
  new: 'bg-brand-100 text-brand-700',
  confirmed: 'bg-brand-500 text-white',
  shipped: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-coral-50 text-coral-600',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone[status]}`}>{STATUS_LABEL[status]}</span>
}
