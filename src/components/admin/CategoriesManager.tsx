'use client'

import { ActionIcon, Badge, Button, Group, Paper, Stack, Table, TextInput, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useState, useTransition } from 'react'
import { createCategoryAction, deleteCategoryAction, renameCategoryAction } from '@/features/admin/actions'

type Row = { id: number; name: string; slug: string; products: number }

export function CategoriesManager({ rows }: { rows: Row[] }) {
  const [name, setName] = useState('')
  const [pending, start] = useTransition()
  const fail = (message?: string) => {
    if (message) notifications.show({ color: 'red', message })
  }

  return (
    <Stack maw={720}>
      <Title order={2}>Категории</Title>
      <Paper withBorder p="md" radius="md">
        <Group align="end">
          <TextInput label="Новая категория" value={name} onChange={(e) => setName(e.currentTarget.value)} style={{ flex: 1 }} />
          <Button loading={pending} onClick={() => start(async () => { const r = await createCategoryAction(name); if (r.error) fail(r.error); else setName('') })}>Добавить</Button>
        </Group>
      </Paper>
      <Table withTableBorder bg="white">
        <Table.Thead><Table.Tr><Table.Th>Название</Table.Th><Table.Th>Адрес</Table.Th><Table.Th>Товаров</Table.Th><Table.Th /></Table.Tr></Table.Thead>
        <Table.Tbody>
          {rows.map((r) => (
            <Table.Tr key={r.id}>
              <Table.Td>
                <TextInput variant="unstyled" defaultValue={r.name} onBlur={(e) => e.currentTarget.value !== r.name && start(() => renameCategoryAction(r.id, e.currentTarget.value))} />
              </Table.Td>
              <Table.Td>/catalog/{r.slug}</Table.Td>
              <Table.Td><Badge variant="light">{r.products}</Badge></Table.Td>
              <Table.Td>
                <ActionIcon variant="subtle" color="red" aria-label="Удалить" onClick={() => start(async () => fail((await deleteCategoryAction(r.id)).error))}>✕</ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
