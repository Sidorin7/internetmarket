'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, LogOut, Package, UserRound } from 'lucide-react'
import { LogoutButton } from './LogoutButton'

const links = [
  { href: '/account', label: 'Заказы', icon: Package },
  { href: '/account/favorites', label: 'Избранное', icon: Heart },
  { href: '/account/profile', label: 'Личные данные', icon: UserRound },
]

export function AccountNav() {
  const path = usePathname()
  const item = 'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium'
  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === '/account' ? path === '/account' || path.startsWith('/account/orders') : path.startsWith(href)
        return (
          <Link key={href} href={href} className={`${item} ${active ? 'bg-brand-500 text-white' : 'hover:bg-surface'}`}>
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
      <LogoutButton className={`${item} text-muted hover:bg-surface lg:mt-4`}>
        <LogOut className="size-4" />
        Выйти
      </LogoutButton>
    </nav>
  )
}
