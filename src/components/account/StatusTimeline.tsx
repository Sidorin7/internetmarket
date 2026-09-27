import { Check, X } from 'lucide-react'
import type { AccountOrder } from '@/features/account/orders'
import { formatDate } from '@/features/account/status'

export function StatusTimeline({ order }: { order: AccountOrder }) {
  if (order.status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-card bg-coral-50 p-4 text-coral-600">
        <X className="size-5 shrink-0" />
        <span className="font-semibold">Заказ отменён{order.cancelledAt ? ` ${formatDate(order.cancelledAt)}` : ''}</span>
      </div>
    )
  }
  const reached = { new: 0, confirmed: 1, shipped: 2 }[order.status]
  const steps = [
    { label: 'Оформлен', date: order.createdAt },
    { label: 'Подтверждён', date: order.confirmedAt },
    { label: 'Отправлен', date: order.shippedAt },
  ]
  return (
    <ol className="grid grid-cols-3 gap-2">
      {steps.map((s, i) => {
        const done = i <= reached
        return (
          <li key={s.label} className="flex flex-col gap-2">
            <div className={`h-1.5 rounded-full ${done ? 'bg-brand-500' : 'bg-line'}`} />
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              {done && <Check className="size-4 shrink-0 text-brand-500" />}
              <span className={done ? '' : 'text-muted'}>{s.label}</span>
            </div>
            {done && s.date && <span className="text-xs text-muted">{formatDate(s.date)}</span>}
          </li>
        )
      })}
    </ol>
  )
}
