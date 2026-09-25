import { randomUUID } from 'node:crypto'
import { and, eq, gte, sql } from 'drizzle-orm'
import type { DB } from '@/db'
import { orderItems, orders, products, productVariants } from '@/db/schema'
import type { OrderSummary } from './types'

export type OrderInput = {
  customer: { name: string; phone: string; email: string; address: string; comment: string }
  items: { variantId: number; qty: number }[]
}
export type CreateOrderResult = { ok: true; order: OrderSummary } | { ok: false; error: string; variantId?: number }

class OrderError extends Error {
  constructor(message: string, readonly variantId?: number) {
    super(message)
  }
}

const ORDER_NUMBER_BASE = 100000

function mergeItems(items: OrderInput['items']) {
  const map = new Map<number, number>()
  for (const i of items) map.set(i.variantId, (map.get(i.variantId) ?? 0) + i.qty)
  return [...map].map(([variantId, qty]) => ({ variantId, qty }))
}

export function createOrder(db: DB, input: OrderInput): CreateOrderResult {
  const items = mergeItems(input.items)
  try {
    const order = db.transaction((tx) => {
      const lines = items.map(({ variantId, qty }) => {
        const row = tx
          .select({
            productId: products.id,
            title: products.title,
            price: products.price,
            isActive: products.isActive,
            size: productVariants.size,
            stock: productVariants.stock,
          })
          .from(productVariants)
          .innerJoin(products, eq(products.id, productVariants.productId))
          .where(eq(productVariants.id, variantId))
          .get()
        if (!row) throw new OrderError('Один из товаров больше не продаётся', variantId)
        if (!row.isActive) throw new OrderError(`Товар «${row.title}» больше не продаётся`, variantId)
        if (row.stock === 0) throw new OrderError(`«${row.title}» (${row.size}): нет в наличии`, variantId)
        if (row.stock < qty) throw new OrderError(`«${row.title}» (${row.size}): осталось ${row.stock} шт.`, variantId)
        return { ...row, variantId, qty }
      })

      for (const l of lines) {
        // условие stock >= qty — вторая линия защиты от ухода в минус
        const res = tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${l.qty}` })
          .where(and(eq(productVariants.id, l.variantId), gte(productVariants.stock, l.qty)))
          .run()
        if (res.changes !== 1) throw new OrderError(`«${l.title}» (${l.size}): нет в наличии`, l.variantId)
      }

      const total = lines.reduce((s, l) => s + l.price * l.qty, 0)
      const created = tx
        .insert(orders)
        .values({
          number: `tmp-${randomUUID()}`,
          customerName: input.customer.name,
          phone: input.customer.phone,
          email: input.customer.email,
          address: input.customer.address,
          comment: input.customer.comment,
          total,
        })
        .returning()
        .get()
      const number = String(ORDER_NUMBER_BASE + created.id)
      tx.update(orders).set({ number }).where(eq(orders.id, created.id)).run()

      for (const l of lines) {
        tx.insert(orderItems)
          .values({ orderId: created.id, productId: l.productId, variantId: l.variantId, title: l.title, size: l.size, price: l.price, qty: l.qty })
          .run()
      }

      return {
        id: created.id,
        number,
        customerName: created.customerName,
        phone: created.phone,
        email: created.email,
        address: created.address,
        comment: created.comment,
        total,
        createdAt: created.createdAt,
        items: lines.map((l) => ({ title: l.title, size: l.size, price: l.price, qty: l.qty })),
      } satisfies OrderSummary
    })
    return { ok: true, order }
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message, variantId: e.variantId }
    throw e
  }
}
