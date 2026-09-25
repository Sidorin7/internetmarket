import { lt, sql } from 'drizzle-orm'
import type { DB } from '@/db'
import { rateLimits } from '@/db/schema'

// Один атомарный upsert: окно истекло — счётчик начинается заново, иначе растёт
export async function hitRateLimit(db: DB, key: string, limit: number, windowMs: number, now = Date.now()) {
  const row = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt: now + windowMs })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= ${now} then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= ${now} then ${now + windowMs} else ${rateLimits.resetAt} end`,
      },
    })
    .returning()
    .get()
  if (Math.random() < 0.02) await db.delete(rateLimits).where(lt(rateLimits.resetAt, now)).run()
  return row.count <= limit ? { ok: true as const } : { ok: false as const, retryAfterMs: row.resetAt - now }
}
