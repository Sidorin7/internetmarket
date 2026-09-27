'use client'

import { useTransition } from 'react'
import { logoutAction } from '@/features/account/auth-actions'
import { useFavorites } from '@/features/favorites/store'

// Обычная кнопка, а не <form>: её вставляют и внутрь формы checkout
export function LogoutButton({ to = '/', className, children = 'Выйти' }: { to?: string; className?: string; children?: React.ReactNode }) {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => {
        useFavorites.getState().reset()
        start(() => logoutAction(to))
      }}
    >
      {children}
    </button>
  )
}
