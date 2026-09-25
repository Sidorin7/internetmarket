import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { createTestDb, seedFixture } from '@/test/db'
import { orderItems, orders, products, productVariants } from './schema'

describe('schema', () => {
  it('cascades variants and nulls order item refs when product deleted', async () => {
    const db = await createTestDb()
    const f = await seedFixture(db)
    const order = await db
      .insert(orders)
      .values({ number: '100001', customerName: 'Аня', phone: '+79000000000', email: 'a@a.ru', address: 'Москва', total: 499000 })
      .returning()
      .get()
    await db.insert(orderItems)
      .values({ orderId: order.id, productId: f.products.dress.id, variantId: f.variants.dressS.id, title: 'Льняное платье', size: 'S', price: 499000, qty: 1 })
      .run()

    await db.delete(products).where(eq(products.id, f.products.dress.id)).run()

    expect(await db.select().from(productVariants).where(eq(productVariants.productId, f.products.dress.id)).all()).toHaveLength(0)
    const item = (await db.select().from(orderItems).get())!
    expect(item.productId).toBeNull()
    expect(item.variantId).toBeNull()
    expect(item.title).toBe('Льняное платье')
  })
})
