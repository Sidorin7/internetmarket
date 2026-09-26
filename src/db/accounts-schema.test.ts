import { sql } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { createTestDb } from '@/test/db'
import { favorites, loginCodes, users } from './schema'

describe('accounts schema', () => {
  it('creates users, login_codes, favorites and order status dates', async () => {
    const db = await createTestDb()
    const u = await db.insert(users).values({ email: 'a@a.ru' }).returning().get()
    expect(u).toMatchObject({ email: 'a@a.ru', name: '', phone: '', address: '' })
    await db.insert(loginCodes).values({ email: 'a@a.ru', codeHash: 'h', expiresAt: 1 }).run()
    expect((await db.select().from(loginCodes).get())!.attempts).toBe(0)
    expect(await db.select().from(favorites).all()).toEqual([])
    const cols = await db.all<{ name: string }>(sql`select name from pragma_table_info('orders')`)
    expect(cols.map((c) => c.name)).toEqual(expect.arrayContaining(['confirmed_at', 'shipped_at', 'cancelled_at']))
    const idx = await db.all<{ name: string }>(sql`select name from sqlite_master where type = 'index' and name = 'orders_email_lower_idx'`)
    expect(idx).toHaveLength(1)
  })
})
