'use client'

import { useActionState } from 'react'
import { updateProfileAction, type ProfileState } from '@/features/account/actions'

const field = 'h-12 w-full rounded-xl border border-line px-4 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

type Defaults = { email: string; name: string; phone: string; address: string }

type FieldProps = { name: 'name' | 'phone' | 'address'; label: string; state: ProfileState; defaults: Defaults } & React.InputHTMLAttributes<HTMLInputElement>

function Field({ name, label, state, defaults, ...rest }: FieldProps) {
  const error = state.fieldErrors?.[name]?.[0]
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <input name={name} defaultValue={state.values?.[name] ?? defaults[name]} aria-invalid={Boolean(error)} className={`${field} ${error ? 'border-coral-500' : ''}`} {...rest} />
      {error && <span className="text-sm text-coral-600">{error}</span>}
    </label>
  )
}

export function ProfileForm({ defaults }: { defaults: Defaults }) {
  const [state, action, pending] = useActionState(updateProfileAction, {})
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4 rounded-card border border-line p-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Email</span>
        <input value={defaults.email} readOnly className={`${field} bg-surface text-muted`} />
      </label>
      <Field name="name" label="Имя и фамилия" autoComplete="name" state={state} defaults={defaults} />
      <Field name="phone" label="Телефон" type="tel" autoComplete="tel" placeholder="+7 900 000-00-00" state={state} defaults={defaults} />
      <Field name="address" label="Адрес доставки" autoComplete="street-address" placeholder="Город, улица, дом, квартира" state={state} defaults={defaults} />
      {state.error && <p role="alert" className="rounded-xl bg-coral-50 p-3 text-sm font-medium text-coral-600">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium text-brand-600">Сохранено — подставим в следующий заказ</p>}
      <button type="submit" disabled={pending} className="h-12 rounded-2xl bg-brand-500 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
        {pending ? 'Сохраняем…' : 'Сохранить'}
      </button>
    </form>
  )
}
