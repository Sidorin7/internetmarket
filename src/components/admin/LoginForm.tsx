'use client'

import { Button, Paper, PasswordInput, Stack, Title } from '@mantine/core'
import { useActionState } from 'react'
import { login } from '@/features/admin/auth-actions'

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {})
  return (
    <Paper component="form" action={action} withBorder shadow="md" p="xl" radius="lg" w={360}>
      <Stack>
        <Title order={3}>Вход для продавца</Title>
        <PasswordInput name="password" label="Пароль" required autoFocus error={state.error} />
        <Button type="submit" loading={pending}>Войти</Button>
      </Stack>
    </Paper>
  )
}
