import { defineConfig, devices } from '@playwright/test'

const env = {
  DATABASE_URL: 'data/e2e.db',
  UPLOAD_DIR: 'data/e2e-uploads',
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: '1',
  SELLER_EMAIL: 'seller@example.com',
  ADMIN_PASSWORD: 'e2e-pass',
  SESSION_SECRET: 'e2e-secret-e2e-secret-e2e-secret-e2e',
}

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:3100', trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npx tsx e2e/prepare-db.ts && npm run dev -- --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    env,
  },
})
