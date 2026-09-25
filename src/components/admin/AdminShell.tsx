'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AppShell, Button, Group, NavLink, Text } from '@mantine/core'
import { logout } from '@/features/admin/auth-actions'
import { SHOP_NAME } from '@/lib/config'

const LINKS = [
  { href: '/admin/products', label: 'Товары' },
  { href: '/admin/categories', label: 'Категории' },
  { href: '/admin/orders', label: 'Заказы' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="lg">
      <AppShell.Header px="lg">
        <Group h="100%" justify="space-between">
          <Text fw={800}>{SHOP_NAME} · админка</Text>
          <Group>
            <Button component={Link} href="/" variant="subtle" size="xs" target="_blank">Открыть сайт</Button>
            <form action={logout}><Button type="submit" variant="light" size="xs">Выйти</Button></form>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="sm">
        {LINKS.map((l) => (
          <NavLink key={l.href} component={Link} href={l.href} label={l.label} active={pathname.startsWith(l.href)} />
        ))}
      </AppShell.Navbar>
      <AppShell.Main bg="gray.0">{children}</AppShell.Main>
    </AppShell>
  )
}
