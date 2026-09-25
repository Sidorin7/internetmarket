'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useCartLines } from '../cart/CartView'
import { placeOrder, type CheckoutState } from '@/features/orders/actions'
import { formatPrice } from '@/lib/money'

const field = 'h-12 w-full rounded-xl border border-line px-4 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

function Field({ name, label, state, ...rest }: { name: string; label: string; state: CheckoutState } & React.InputHTMLAttributes<HTMLInputElement>) {
  const error = state.fieldErrors?.[name as keyof NonNullable<CheckoutState['fieldErrors']>]?.[0]
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <input name={name} defaultValue={state.values?.[name]} aria-invalid={Boolean(error)} className={`${field} ${error ? 'border-coral-500' : ''}`} {...rest} />
      {error && <span className="text-sm text-coral-600">{error}</span>}
    </label>
  )
}

export function CheckoutForm() {
  const { lines, loading } = useCartLines()
  const [state, action, pending] = useActionState(placeOrder, {})
  const available = lines.filter((l) => l.available)
  const total = available.reduce((s, l) => s + l.price * l.qty, 0)

  if (loading) return <div className="h-64 animate-pulse rounded-card bg-surface" />
  if (!available.length) {
    return (
      <p className="rounded-card bg-surface p-10 text-center">
        Корзина пуста. <Link href="/" className="font-semibold text-brand-600">Вернуться к покупкам</Link>
      </p>
    )
  }

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="items" value={JSON.stringify(available.map((l) => ({ variantId: l.variantId, qty: l.qty })))} />
      <div className="flex flex-col gap-4 rounded-card border border-line p-5">
        <Field name="name" label="Имя и фамилия" autoComplete="name" required state={state} />
        <Field name="phone" label="Телефон" type="tel" autoComplete="tel" placeholder="+7 900 000-00-00" required state={state} />
        <Field name="email" label="Email — пришлём подтверждение" type="email" autoComplete="email" required state={state} />
        <Field name="address" label="Адрес доставки" autoComplete="street-address" placeholder="Город, улица, дом, квартира" required state={state} />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Комментарий</span>
          <textarea name="comment" defaultValue={state.values?.comment} maxLength={500} rows={3} className="w-full rounded-xl border border-line p-4 outline-none focus:border-brand-500" />
        </label>
      </div>
      <aside className="h-fit rounded-card bg-surface p-5 lg:sticky lg:top-32">
        <ul className="flex flex-col gap-2 text-sm">
          {available.map((l) => (
            <li key={l.variantId} className={`flex justify-between gap-3 ${state.badVariantId === l.variantId ? 'font-semibold text-coral-600' : ''}`}>
              <span>{l.title}, {l.size} × {l.qty}</span>
              <span className="shrink-0">{formatPrice(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-display font-bold">Итого</span>
          <span className="font-display text-2xl font-bold">{formatPrice(total)}</span>
        </div>
        {(state.error || state.fieldErrors?.items) && (
          <p role="alert" className="mt-4 rounded-xl bg-coral-50 p-3 text-sm font-medium text-coral-600">
            {state.error ?? state.fieldErrors?.items?.[0]}
            {state.badVariantId && <> — <Link href="/cart" className="underline">изменить корзину</Link></>}
          </p>
        )}
        <button type="submit" disabled={pending} className="mt-5 h-12 w-full rounded-2xl bg-brand-500 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
          {pending ? 'Оформляем…' : 'Подтвердить заказ'}
        </button>
        <p className="mt-3 text-xs text-muted">Оплата при получении. Продавец позвонит для подтверждения.</p>
      </aside>
    </form>
  )
}
