'use client'

import { Anchor, Badge, Select, Stack, Table, Text, Title, Tooltip } from '@mantine/core'
import { useTransition } from 'react'
import { setOrderStatusAction } from '@/features/admin/actions'
import type { listOrders } from '@/features/admin/orders'
import { formatPrice } from '@/lib/money'
import { formatPhone } from '@/lib/phone'

type Row = ReturnType<typeof listOrders>[number]
const STATUS_OPTIONS = [
  { value: 'new', label: 'Новый' },
  { value: 'confirmed', label: 'Подтверждён' },
  { value: 'shipped', label: 'Отправлен' },
  { value: 'cancelled', label: 'Отменён' },
]
const dateFmt = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' })

export function OrdersTable({ rows }: { rows: Row[] }) {
  const [pending, start] = useTransition()
  return (
    <Stack>
      <Title order={2}>Заказы ({rows.length})</Title>
      <Table withTableBorder bg="white" verticalSpacing="sm" opacity={pending ? 0.7 : 1}>
        <Table.Thead><Table.Tr><Table.Th>№</Table.Th><Table.Th>Дата</Table.Th><Table.Th>Покупатель</Table.Th><Table.Th>Состав</Table.Th><Table.Th>Сумма</Table.Th><Table.Th>Статус</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>
          {rows.map((o) => (
            <Table.Tr key={o.id}>
              <Table.Td>
                <Text fw={700}>{o.number}</Text>
                {!o.emailSent && <Tooltip label="Письма не отправились — свяжитесь вручную"><Badge color="orange" size="xs">без письма</Badge></Tooltip>}
              </Table.Td>
              <Table.Td>{dateFmt.format(o.createdAt)}</Table.Td>
              <Table.Td>
                <Text size="sm" fw={500}>{o.customerName}</Text>
                <Anchor size="sm" href={`tel:${o.phone}`}>{formatPhone(o.phone)}</Anchor>
                <Text size="xs" c="dimmed">{o.email}</Text>
                <Text size="xs" c="dimmed">{o.address}</Text>
                {o.comment && <Text size="xs" fs="italic">💬 {o.comment}</Text>}
              </Table.Td>
              <Table.Td>{o.items.map((i, idx) => <Text key={idx} size="sm">{i.title}, {i.size} × {i.qty}</Text>)}</Table.Td>
              <Table.Td fw={600}>{formatPrice(o.total)}</Table.Td>
              <Table.Td>
                <Select w={150} data={STATUS_OPTIONS} value={o.status} allowDeselect={false} onChange={(v) => v && start(() => setOrderStatusAction(o.id, v))} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
