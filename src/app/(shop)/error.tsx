'use client'

export default function ShopError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-card bg-surface p-12 text-center">
      <p className="font-display text-xl font-bold">Что-то пошло не так</p>
      <button type="button" onClick={reset} className="mt-4 rounded-2xl bg-brand-500 px-6 py-3 font-semibold text-white">Попробовать снова</button>
    </div>
  )
}
