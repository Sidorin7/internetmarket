import 'server-only'
import { createDb, type DB } from './index'

const globalForDb = globalThis as unknown as { __shopDb?: DB }

export const db = globalForDb.__shopDb ?? createDb(process.env.DATABASE_URL ?? 'data/shop.db', process.env.DATABASE_AUTH_TOKEN)

if (process.env.NODE_ENV !== 'production') globalForDb.__shopDb = db
