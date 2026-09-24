// src/db/migrate.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { createDb } from './index'

const db = createDb(process.env.DATABASE_URL ?? 'data/shop.db')
migrate(db, { migrationsFolder: 'drizzle' })
console.log('✔ migrations applied')
