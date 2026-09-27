import { asc, desc, eq, inArray } from 'drizzle-orm'
import type { DB } from '@/db'
import { orderItems, orders, type OrderStatus } from '@/db/schema'
import { restockOrder } from '@/features/orders/restock'
import type { OrderItemSummary, OrderSummary } from '@/features/orders/types'

export async function listOrders(db: DB, limit = 200): Promise<(OrderSummary & { status: OrderStatus; emailSent: boolean })[]> {
  const rows = await db.select().from(orders).orderBy(desc(orders.id)).limit(limit).all()
  const items = new Map<number, OrderItemSummary[]>()
  if (rows.length) {
    const all = await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((r) => r.id))).orderBy(asc(orderItems.id)).all()
    for (const i of all) items.set(i.orderId, [...(items.get(i.orderId) ?? []), { title: i.title, size: i.size, price: i.price, qty: i.qty }])
  }
  return rows.map((o) => ({
    id: o.id, number: o.number, customerName: o.customerName, phone: o.phone, email: o.email, address: o.address,
    comment: o.comment, total: o.total, createdAt: o.createdAt, status: o.status, emailSent: o.emailSent, items: items.get(o.id) ?? [],
  }))
}

function statusDate(status: OrderStatus, now: Date) {
  if (status === 'confirmed') return { confirmedAt: now }
  if (status === 'shipped') return { shippedAt: now }
  if (status === 'cancelled') return { cancelledAt: now }
  return {}
}

// Отмена возвращает товар на склад; обратно из «Отменён» не выводим — повторное списание могло бы увести остаток в минус
export async function setOrderStatus(db: DB, id: number, status: OrderStatus, now = new Date()): Promise<{ ok: true } | { ok: false; error: string }> {
  return db.transaction(async (tx): Promise<{ ok: true } | { ok: false; error: string }> => {
    const current = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, id)).get()
    if (!current) return { ok: false, error: 'Заказ не найден' }
    if (current.status === status) return { ok: true }
    if (current.status === 'cancelled') return { ok: false, error: 'Отменённый заказ нельзя вернуть — оформите новый' }
    if (status === 'cancelled') await restockOrder(tx, id)
    await tx.update(orders).set({ status, ...statusDate(status, now) }).where(eq(orders.id, id)).run()
    return { ok: true }
  })
}
