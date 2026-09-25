import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CircleCheck } from 'lucide-react'
import { db } from '@/db/client'
import { getOrderByNumber } from '@/features/orders/queries'
import { formatPrice } from '@/lib/money'
import { ClearCart } from './ClearCart'

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ new?: string }> }

export const metadata = { title: 'Заказ оформлен' }

export default async function OrderPage({ params, searchParams }: Props) {
  const order = getOrderByNumber(db, (await params).number)
  if (!order) notFound()
  const isNew = (await searchParams).new === '1'
  return (
    <div className="mx-auto max-w-xl rounded-card border border-line p-8 text-center">
      {isNew && <ClearCart />}
      <CircleCheck className="mx-auto size-16 text-brand-500" />
      <h1 className="mt-4 font-display text-2xl font-bold">Заказ №{order.number} оформлен</h1>
      <p className="mt-2 text-muted">Скоро позвоним, чтобы подтвердить заказ. Письмо с деталями придёт на почту.</p>
      <ul className="mt-6 flex flex-col gap-2 text-left text-sm">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex justify-between gap-3"><span>{i.title}, {i.size} × {i.qty}</span><span>{formatPrice(i.price * i.qty)}</span></li>
        ))}
      </ul>
      <p className="mt-4 border-t border-line pt-4 text-right font-display text-xl font-bold">{formatPrice(order.total)}</p>
      <Link href="/" className="mt-6 inline-block rounded-2xl bg-brand-500 px-6 py-3 font-semibold text-white">Продолжить покупки</Link>
    </div>
  )
}
