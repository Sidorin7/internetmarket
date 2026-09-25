'use client'

import Link from 'next/link'
import { ActionIcon, Badge, Button, Group, Image, Table, Text, Title } from '@mantine/core'
import { useTransition } from 'react'
import { deleteProductAction } from '@/features/admin/actions'
import { formatPrice } from '@/lib/money'

type Row = { id: number; slug: string; title: string; price: number; isActive: boolean; category: string; image: string | null; stock: number }

export function ProductsTable({ rows }: { rows: Row[] }) {
  const [pending, start] = useTransition()
  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Товары ({rows.length})</Title>
        <Button component={Link} href="/admin/products/new">Добавить товар</Button>
      </Group>
      <Table striped highlightOnHover withTableBorder bg="white">
        <Table.Thead>
          <Table.Tr><Table.Th w={60} /><Table.Th>Название</Table.Th><Table.Th>Категория</Table.Th><Table.Th>Цена</Table.Th><Table.Th>Остаток</Table.Th><Table.Th>Статус</Table.Th><Table.Th /></Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r) => (
            <Table.Tr key={r.id} opacity={pending ? 0.6 : 1}>
              <Table.Td>{r.image && <Image src={r.image} alt="" w={40} h={53} radius="sm" fit="cover" />}</Table.Td>
              <Table.Td><Text component={Link} href={`/admin/products/${r.id}`} fw={500} c="violet">{r.title}</Text></Table.Td>
              <Table.Td>{r.category}</Table.Td>
              <Table.Td>{formatPrice(r.price)}</Table.Td>
              <Table.Td><Text c={r.stock === 0 ? 'red' : undefined}>{r.stock}</Text></Table.Td>
              <Table.Td>{r.isActive ? <Badge color="green">В продаже</Badge> : <Badge color="gray">Скрыт</Badge>}</Table.Td>
              <Table.Td>
                <ActionIcon variant="subtle" color="red" aria-label="Удалить" onClick={() => confirm(`Удалить «${r.title}»? История заказов сохранится.`) && start(() => deleteProductAction(r.id))}>✕</ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  )
}
