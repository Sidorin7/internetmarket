import { formatPhone } from '@/lib/phone'
import { requireUser } from '@/lib/user'
import { ProfileForm } from './ProfileForm'

export const metadata = { title: 'Личные данные', robots: { index: false } }

export default async function ProfilePage() {
  const user = await requireUser('/account/profile')
  return <ProfileForm defaults={{ email: user.email, name: user.name, phone: user.phone ? formatPhone(user.phone) : '', address: user.address }} />
}
