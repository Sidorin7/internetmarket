import 'server-only'
import { createDbFromEnv, type DB } from './index'

const globalForDb = globalThis as unknown as { __shopDb?: DB }

export const db = globalForDb.__shopDb ?? createDbFromEnv()

if (process.env.NODE_ENV !== 'production') globalForDb.__shopDb = db
