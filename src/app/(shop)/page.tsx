import { formatPrice } from '@/lib/money'

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="font-display text-3xl font-extrabold text-brand-500">Скоро открытие</h1>
      <p className="mt-2 font-display text-2xl text-coral-500">{formatPrice(299000)}</p>
    </main>
  )
}
