import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import type { DB } from '@/db'
import { orderItems, orders, type OrderStatus } from '@/db/schema'
import { restockOrder } from '@/features/orders/restock'
import type { OrderItemSummary, OrderSummary } from '@/features/orders/types'
import type { CancelledOrder } from '@/lib/mail'
import { normalizeEmail } from './login'

export type AccountOrder = OrderSummary & { status: OrderStatus; confirmedAt: Date | null; shippedAt: Date | null; cancelledAt: Date | null }

const SHIPPED_CURRENT_MS = 14 * 24 * 60 * 60 * 1000

export function isCurrent(o: Pick<AccountOrder, 'status' | 'shippedAt'>, now: Date): boolean {
  if (o.status === 'new' || o.status === 'confirmed') return true
  if (o.status === 'shipped') return o.shippedAt !== null && now.getTime() - o.shippedAt.getTime() < SHIPPED_CURRENT_MS
  return false
}

const byEmail = (email: string) => sql`lower(${orders.email}) = ${normalizeEmail(email)}`

async function loadOrders(db: DB, where: SQL | undefined): Promise<AccountOrder[]> {
  const rows = await db.select().from(orders).where(where).orderBy(desc(orders.id)).all()
  const items = new Map<number, OrderItemSummary[]>()
  if (rows.length) {
    const all = await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((r) => r.id))).orderBy(asc(orderItems.id)).all()
    for (const i of all) items.set(i.orderId, [...(items.get(i.orderId) ?? []), { title: i.title, size: i.size, price: i.price, qty: i.qty }])
  }
  return rows.map((o) => ({
    id: o.id, number: o.number, customerName: o.customerName, phone: o.phone, email: o.email, address: o.address,
    comment: o.comment, total: o.total, createdAt: o.createdAt, status: o.status,
    confirmedAt: o.confirmedAt, shippedAt: o.shippedAt, cancelledAt: o.cancelledAt, items: items.get(o.id) ?? [],
  }))
}

export async function listUserOrders(db: DB, email: string, now = new Date()) {
  const all = await loadOrders(db, byEmail(email))
  return { current: all.filter((o) => isCurrent(o, now)), history: all.filter((o) => !isCurrent(o, now)) }
}

export async function getUserOrder(db: DB, email: string, number: string): Promise<AccountOrder | null> {
  return (await loadOrders(db, and(eq(orders.number, number), byEmail(email))))[0] ?? null
}

type CancelResult = { ok: true; order: CancelledOrder } | { ok: false; error: string }

export async function cancelOrderByCustomer(db: DB, email: string, number: string, now = new Date()): Promise<CancelResult> {
  return db.transaction(async (tx): Promise<CancelResult> => {
    const o = await tx.select().from(orders).where(and(eq(orders.number, number), byEmail(email))).get()
    if (!o) return { ok: false, error: 'Заказ не найден' }
    // условие status = 'new' в самом UPDATE — админ мог подтвердить заказ между чтением и записью
    const res = await tx.update(orders).set({ status: 'cancelled', cancelledAt: now }).where(and(eq(orders.id, o.id), eq(orders.status, 'new'))).run()
    if (res.rowsAffected !== 1) {
      return { ok: false, error: o.status === 'cancelled' ? 'Заказ уже отменён' : 'Заказ уже подтверждён — чтобы отменить, позвоните нам' }
    }
    await restockOrder(tx, o.id)
    return { ok: true, order: { number: o.number, customerName: o.customerName, phone: o.phone, total: o.total } }
  })
}
