import { and, eq, isNotNull, sql } from 'drizzle-orm'
import type { Tx } from '@/db'
import { orderItems, productVariants } from '@/db/schema'

export async function restockOrder(tx: Tx, orderId: number): Promise<void> {
  const items = await tx.select().from(orderItems).where(and(eq(orderItems.orderId, orderId), isNotNull(orderItems.variantId))).all()
  for (const i of items) {
    await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${i.qty}` }).where(eq(productVariants.id, i.variantId!)).run()
  }
}
