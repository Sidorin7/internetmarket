import Link from 'next/link'
import { OrderCard } from '@/components/account/OrderCard'
import { db } from '@/db/client'
import { listUserOrders, type AccountOrder } from '@/features/account/orders'
import { requireUser } from '@/lib/user'

export const metadata = { title: 'Мои заказы', robots: { index: false } }

function Section({ title, orders }: { title: string; orders: AccountOrder[] }) {
  if (!orders.length) return null
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}
    </section>
  )
}

export default async function AccountOrdersPage() {
  const user = await requireUser('/account')
  const { current, history } = await listUserOrders(db, user.email)
  if (!current.length && !history.length) {
    return (
      <div className="rounded-card bg-surface p-12 text-center">
        <p className="font-display text-xl font-bold">Заказов пока нет</p>
        <p className="mt-1 text-muted">Здесь появятся все заказы на {user.email}</p>
        <Link href="/" className="mt-4 inline-block rounded-2xl bg-brand-500 px-6 py-3 font-semibold text-white">Смотреть ленту</Link>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-8">
      <Section title="Текущие заказы" orders={current} />
      <Section title="История покупок" orders={history} />
    </div>
  )
}
