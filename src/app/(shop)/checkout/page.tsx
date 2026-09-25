import { CheckoutForm } from './CheckoutForm'

export const metadata = { title: 'Оформление заказа' }

export default function CheckoutPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Оформление заказа</h1>
      <CheckoutForm />
    </div>
  )
}
