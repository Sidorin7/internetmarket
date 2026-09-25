import { defineConfig } from 'drizzle-kit'

const url = process.env.DATABASE_URL ?? 'data/shop.db'

export default defineConfig({
  dialect: 'turso',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: /^[a-z]+:/.test(url) ? url : `file:${url}`,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
})
