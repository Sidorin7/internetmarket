import { expect, test } from '@playwright/test'
import { sql } from 'drizzle-orm'
import { createDb } from '../src/db'
import { issueLoginCode } from '../src/features/account/login'

// значение из playwright.config.ts — код хешируется тем же секретом, что и на сервере
process.env.SESSION_SECRET = 'e2e-secret-e2e-secret-e2e-secret-e2e'
const db = createDb('data/e2e.db')

test('customer logs in, orders, sees and cancels the order', async ({ page }, testInfo) => {
  const email = `buyer-${testInfo.project.name}@example.com`

  await page.goto('/account')
  await expect(page).toHaveURL(/\/login\?next=%2Faccount$/)
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Получить код' }).click()
  await expect(page.getByText(`Отправили код на ${email}`)).toBeVisible()

  // SMTP в e2e недоступен — перевыпускаем код напрямую в БД
  // сервер и второй воркер пишут в тот же файл — ждём блокировку, а не падаем
  await db.run(sql`PRAGMA busy_timeout = 5000`)
  const code = await issueLoginCode(db, email)
  await page.getByLabel('Код из письма').fill(code)
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByText('Заказов пока нет')).toBeVisible()

  await page.goto('/catalog/obuv')
  await page.getByRole('link', { name: 'Выбрать размер' }).first().click()
  await page.locator('button:not([disabled])', { hasText: /^\d{2}$/ }).first().click()
  await page.getByRole('button', { name: 'Добавить в корзину' }).click()
  await expect(page.getByRole('link', { name: 'Перейти в корзину' })).toBeVisible()
  await page.goto('/checkout')

  await expect(page.getByLabel(/Email/)).toHaveValue(email)
  await expect(page.getByLabel(/Email/)).toHaveAttribute('readonly', '')
  await page.getByLabel('Имя и фамилия').fill('Тест Тестов')
  await page.getByLabel('Телефон').fill('8 900 123 45 67')
  await page.getByLabel('Адрес доставки').fill('Москва, ул. Тестовая, 1')
  await page.getByRole('button', { name: 'Подтвердить заказ' }).click()
  await expect(page).toHaveURL(/\/order\/\d{6}\?new=1/)

  await page.getByRole('link', { name: 'Мои заказы' }).click()
  await expect(page.getByRole('heading', { name: /Заказ №\d{6}/ })).toBeVisible()
  await page.getByRole('button', { name: 'Отменить заказ' }).click()
  await page.getByRole('button', { name: 'Да, отменить' }).click()
  await expect(page.getByText(/Заказ отменён/)).toBeVisible()

  await page.getByRole('link', { name: 'Все заказы' }).click()
  await expect(page.getByRole('heading', { name: 'История покупок' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Текущие заказы' })).toHaveCount(0)

  await page.goto('/account/profile')
  await expect(page.getByLabel('Имя и фамилия')).toHaveValue('Тест Тестов')
})
