import { migrate } from 'drizzle-orm/libsql/migrator'
import { createDbFromEnv } from './index'

async function main() {
  const db = createDbFromEnv()
  await migrate(db, { migrationsFolder: 'drizzle' })
  console.log('✔ migrations applied')
}

main()
