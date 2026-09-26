import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { StatusBadge } from '@/components/account/StatusBadge'
import { StatusTimeline } from '@/components/account/StatusTimeline'
import { db } from '@/db/client'
import { getUserOrder } from '@/features/account/orders'
import { formatDate } from '@/features/account/status'
import { formatPrice } from '@/lib/money'
import { formatPhone } from '@/lib/phone'
import { requireUser } from '@/lib/user'
import { CancelOrderButton } from './CancelOrderButton'

type Props = { params: Promise<{ number: string }> }

export const metadata = { title: 'Заказ', robots: { index: false } }

export default async function AccountOrderPage({ params }: Props) {
  const { number } = await params
  const user = await requireUser(`/account/orders/${number}`)
  const order = await getUserOrder(db, user.email, number)
  if (!order) notFound()
  return (
    <div className="flex flex-col gap-6">
      <Link href="/account" className="flex w-fit items-center gap-1 text-sm text-muted hover:text-brand-600">
        <ChevronLeft className="size-4" />
        Все заказы
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Заказ №{order.number}</h2>
          <p className="text-sm text-muted">от {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <StatusTimeline order={order} />
      <div className="rounded-card border border-line p-5">
        <ul className="flex flex-col gap-2 text-sm">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3">
              <span>{i.title}, {i.size} × {i.qty}</span>
              <span className="shrink-0">{formatPrice(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between border-t border-line pt-4 font-display text-xl font-bold">
          <span>Итого</span>
          <span>{formatPrice(order.total)}</span>
        </p>
      </div>
      <dl className="grid gap-3 rounded-card bg-surface p-5 text-sm sm:grid-cols-2">
        <div><dt className="text-muted">Получатель</dt><dd className="font-medium">{order.customerName}</dd></div>
        <div><dt className="text-muted">Телефон</dt><dd className="font-medium">{formatPhone(order.phone)}</dd></div>
        <div className="sm:col-span-2"><dt className="text-muted">Адрес доставки</dt><dd className="font-medium">{order.address}</dd></div>
        {order.comment && <div className="sm:col-span-2"><dt className="text-muted">Комментарий</dt><dd>{order.comment}</dd></div>}
      </dl>
      {order.status === 'new' && <CancelOrderButton number={order.number} />}
    </div>
  )
}
