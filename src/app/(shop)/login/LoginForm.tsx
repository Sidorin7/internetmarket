'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { requestCodeAction, verifyCodeAction, type LoginState } from '@/features/account/auth-actions'
import { syncFavoritesAction } from '@/features/favorites/actions'
import { useFavorites } from '@/features/favorites/store'

const field = 'h-12 w-full rounded-xl border border-line px-4 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100'
const button = 'h-12 w-full rounded-2xl bg-brand-500 font-semibold text-white hover:bg-brand-600 disabled:opacity-60'

function Alert({ state }: { state: LoginState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-coral-50 p-3 text-sm font-medium text-coral-600">{state.error}</p>
  if (state.info) return <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700">{state.info}</p>
  return null
}

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [sent, requestCode, requesting] = useActionState(requestCodeAction, { step: 'email' })
  const [checked, verifyCode, verifying] = useActionState(verifyCodeAction, { step: 'code' })
  const [changingEmail, setChangingEmail] = useState(false)
  const onCodeStep = sent.step === 'code' && !changingEmail

  useEffect(() => {
    if (checked.step !== 'done') return
    let cancelled = false
    const store = useFavorites.getState()
    syncFavoritesAction(store.ids)
      .then((ids) => {
        if (ids) store.replaceFromServer(ids)
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return
        router.replace(checked.next ?? '/account')
        router.refresh()
      })
    return () => {
      cancelled = true
    }
  }, [checked, router])

  if (!onCodeStep) {
    return (
      <form action={requestCode} onSubmit={() => setChangingEmail(false)} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Email</span>
          <input name="email" type="email" autoComplete="email" required defaultValue={sent.email} className={field} />
        </label>
        <Alert state={sent} />
        <button type="submit" disabled={requesting} className={button}>{requesting ? 'Отправляем…' : 'Получить код'}</button>
      </form>
    )
  }

  const busy = verifying || checked.step === 'done'
  return (
    <div className="mt-6 flex flex-col gap-4">
      <form action={verifyCode} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={sent.email} />
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Код из письма</span>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            required
            autoFocus
            className={`${field} text-center font-display text-2xl tracking-[0.4em]`}
          />
        </label>
        <Alert state={checked.error ? checked : sent} />
        <button type="submit" disabled={busy} className={button}>{busy ? 'Входим…' : 'Войти'}</button>
      </form>
      <div className="flex justify-between text-sm">
        <form action={requestCode}>
          <input type="hidden" name="email" value={sent.email} />
          <button type="submit" disabled={requesting} className="font-semibold text-brand-600 disabled:opacity-60">Отправить ещё раз</button>
        </form>
        <button type="button" onClick={() => setChangingEmail(true)} className="text-muted hover:text-ink">Другой email</button>
      </div>
    </div>
  )
}
