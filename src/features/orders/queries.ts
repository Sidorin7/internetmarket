import { asc, eq } from 'drizzle-orm'
import type { DB } from '@/db'
import { orderItems, orders } from '@/db/schema'
import type { OrderSummary } from './types'

export function getOrderByNumber(db: DB, number: string): OrderSummary | null {
  const o = db.select().from(orders).where(eq(orders.number, number)).get()
  if (!o) return null
  const items = db
    .select({ title: orderItems.title, size: orderItems.size, price: orderItems.price, qty: orderItems.qty })
    .from(orderItems)
    .where(eq(orderItems.orderId, o.id))
    .orderBy(asc(orderItems.id))
    .all()
  return {
    id: o.id, number: o.number, customerName: o.customerName, phone: o.phone, email: o.email,
    address: o.address, comment: o.comment, total: o.total, createdAt: o.createdAt, items,
  }
}
