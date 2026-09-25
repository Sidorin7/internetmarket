import { asc, desc, eq, inArray } from 'drizzle-orm'
import type { DB } from '@/db'
import { orderItems, orders, type OrderStatus } from '@/db/schema'
import type { OrderItemSummary, OrderSummary } from '@/features/orders/types'

export function listOrders(db: DB, limit = 200): (OrderSummary & { status: OrderStatus; emailSent: boolean })[] {
  const rows = db.select().from(orders).orderBy(desc(orders.id)).limit(limit).all()
  const items = new Map<number, OrderItemSummary[]>()
  if (rows.length) {
    const all = db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((r) => r.id))).orderBy(asc(orderItems.id)).all()
    for (const i of all) items.set(i.orderId, [...(items.get(i.orderId) ?? []), { title: i.title, size: i.size, price: i.price, qty: i.qty }])
  }
  return rows.map((o) => ({
    id: o.id, number: o.number, customerName: o.customerName, phone: o.phone, email: o.email, address: o.address,
    comment: o.comment, total: o.total, createdAt: o.createdAt, status: o.status, emailSent: o.emailSent, items: items.get(o.id) ?? [],
  }))
}

export function setOrderStatus(db: DB, id: number, status: OrderStatus): void {
  db.update(orders).set({ status }).where(eq(orders.id, id)).run()
}
