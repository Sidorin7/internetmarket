import { AccountNav } from '@/components/account/AccountNav'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Личный кабинет</h1>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside>
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
