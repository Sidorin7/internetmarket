import { CartView } from './CartView'

export const metadata = { title: 'Корзина' }

export default function CartPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Корзина</h1>
      <CartView />
    </div>
  )
}
