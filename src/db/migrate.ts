import { migrate } from 'drizzle-orm/libsql/migrator'
import { createDb } from './index'

async function main() {
  const db = createDb(process.env.DATABASE_URL ?? 'data/shop.db', process.env.DATABASE_AUTH_TOKEN)
  await migrate(db, { migrationsFolder: 'drizzle' })
  console.log('✔ migrations applied')
}

main()
