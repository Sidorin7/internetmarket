import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import fs from 'node:fs'
import path from 'node:path'
import * as schema from './schema'

// Локально — файл (`data/shop.db` или `file:data/shop.db`), в проде — Turso (`libsql://…` + токен).
// libsql включает внешние ключи по умолчанию, каскады из схемы работают и в Turso.
export function resolveDbUrl(url: string): string {
  if (/^(libsql|https?|wss?):\/\//.test(url) || url.startsWith('file:') || url === ':memory:') return url
  return `file:${url}`
}

// Интеграция Turso в маркетплейсе Vercel создаёт TURSO_DATABASE_URL / TURSO_AUTH_TOKEN — понимаем оба варианта имён
export function dbConfigFromEnv(env: Record<string, string | undefined> = process.env) {
  return {
    url: env.DATABASE_URL || env.TURSO_DATABASE_URL || 'data/shop.db',
    authToken: env.DATABASE_AUTH_TOKEN || env.TURSO_AUTH_TOKEN || undefined,
  }
}

export function createDb(url: string, authToken?: string) {
  const resolved = resolveDbUrl(url)
  if (resolved.startsWith('file:')) fs.mkdirSync(path.dirname(path.resolve(resolved.slice('file:'.length))), { recursive: true })
  return drizzle({ client: createClient({ url: resolved, authToken: authToken || undefined }), schema })
}

export function createDbFromEnv() {
  const { url, authToken } = dbConfigFromEnv()
  return createDb(url, authToken)
}

export type DB = ReturnType<typeof createDb>
export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0]
