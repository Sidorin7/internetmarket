// Запускается командой webServer до `next dev`: Playwright стартует сервер раньше globalSetup
import { execSync } from 'node:child_process'
import fs from 'node:fs'

const dbFile = process.env.DATABASE_URL
if (!dbFile?.includes('e2e')) throw new Error(`Refusing to reset non-e2e database: ${dbFile}`)
for (const suffix of ['', '-wal', '-shm']) fs.rmSync(dbFile + suffix, { force: true })
execSync('npx tsx src/db/migrate.ts', { stdio: 'inherit' })
execSync('npx tsx src/db/seed.ts', { stdio: 'inherit' })
