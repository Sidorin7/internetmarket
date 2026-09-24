import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { createTestDb, seedFixture } from '@/test/db'
import { orderItems, orders, products, productVariants } from './schema'

describe('schema', () => {
  it('cascades variants and nulls order item refs when product deleted', () => {
    const db = createTestDb()
    const f = seedFixture(db)
    const order = db
      .insert(orders)
      .values({ number: '100001', customerName: 'Аня', phone: '+79000000000', email: 'a@a.ru', address: 'Москва', total: 499000 })
      .returning()
      .get()
    db.insert(orderItems)
      .values({ orderId: order.id, productId: f.products.dress.id, variantId: f.variants.dressS.id, title: 'Льняное платье', size: 'S', price: 499000, qty: 1 })
      .run()

    db.delete(products).where(eq(products.id, f.products.dress.id)).run()

    expect(db.select().from(productVariants).where(eq(productVariants.productId, f.products.dress.id)).all()).toHaveLength(0)
    const item = db.select().from(orderItems).get()!
    expect(item.productId).toBeNull()
    expect(item.variantId).toBeNull()
    expect(item.title).toBe('Льняное платье')
  })
})
