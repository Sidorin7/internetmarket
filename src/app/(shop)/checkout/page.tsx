import { formatPhone } from '@/lib/phone'
import { getCurrentUser } from '@/lib/user'
import { CheckoutForm } from './CheckoutForm'

export const metadata = { title: 'Оформление заказа' }

export default async function CheckoutPage() {
  const user = await getCurrentUser()
  const defaults = user ? { name: user.name, phone: user.phone ? formatPhone(user.phone) : '', email: user.email, address: user.address } : undefined
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Оформление заказа</h1>
      <CheckoutForm defaults={defaults} signedIn={Boolean(user)} />
    </div>
  )
}
