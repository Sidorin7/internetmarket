'use client'

import { useState, useTransition } from 'react'
import { cancelOrderAction } from '@/features/account/actions'

export function CancelOrderButton({ number }: { number: string }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, start] = useTransition()
  const cancel = () =>
    start(async () => {
      const res = await cancelOrderAction(number)
      if (res.error) setError(res.error)
      setConfirming(false)
    })

  return (
    <div className="flex flex-col gap-2">
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="h-11 w-fit rounded-2xl border border-line px-5 font-semibold text-coral-600 hover:border-coral-500">
          Отменить заказ
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">Точно отменить заказ?</span>
          <button type="button" disabled={pending} onClick={cancel} className="h-11 rounded-2xl bg-coral-500 px-5 font-semibold text-white disabled:opacity-60">
            {pending ? 'Отменяем…' : 'Да, отменить'}
          </button>
          <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="h-11 px-3 text-muted">
            Нет
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-coral-600">{error}</p>}
    </div>
  )
}
