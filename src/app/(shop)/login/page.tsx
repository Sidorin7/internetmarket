import { redirect } from 'next/navigation'
import { safeNext } from '@/features/account/login'
import { getCurrentUser } from '@/lib/user'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Вход', robots: { index: false } }

type Props = { searchParams: Promise<{ next?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next)
  if (await getCurrentUser()) redirect(next)
  return (
    <div className="mx-auto max-w-md rounded-card border border-line p-8">
      <h1 className="font-display text-3xl font-bold">Вход</h1>
      <p className="mt-2 text-muted">Пришлём код на почту — пароль не нужен. Если вы у нас впервые, аккаунт создастся сам.</p>
      <LoginForm next={next} />
    </div>
  )
}
