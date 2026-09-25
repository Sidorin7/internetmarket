import { expect, test } from '@playwright/test'

test('buyer goes from feed to placed order', async ({ page }) => {
  await page.goto('/catalog/obuv')
  await page.getByRole('link', { name: 'Выбрать размер' }).first().click()

  await page.getByRole('button', { name: 'Добавить в корзину' }).click()
  await expect(page.getByText('Выберите размер')).toBeVisible()
  await page.locator('button:not([disabled])', { hasText: /^\d{2}$/ }).first().click()
  await page.getByRole('button', { name: 'Добавить в корзину' }).click()
  await page.getByRole('link', { name: 'Перейти в корзину' }).click()

  await expect(page.getByRole('heading', { name: 'Корзина' })).toBeVisible()
  await page.getByRole('link', { name: 'Оформить заказ' }).click()

  await page.getByRole('button', { name: 'Подтвердить заказ' }).click()
  // браузерная валидация required не даёт отправить пустую форму
  await expect(page).toHaveURL(/\/checkout$/)

  await page.getByLabel('Имя и фамилия').fill('Тест Тестов')
  await page.getByLabel('Телефон').fill('123')
  await page.getByLabel(/Email/).fill('test@example.com')
  await page.getByLabel('Адрес доставки').fill('Москва, ул. Тестовая, 1')
  await page.getByRole('button', { name: 'Подтвердить заказ' }).click()
  await expect(page.getByText('Телефон в формате +7 900 000-00-00')).toBeVisible()
  await expect(page.getByLabel('Имя и фамилия')).toHaveValue('Тест Тестов')

  await page.getByLabel('Телефон').fill('8 900 123 45 67')
  await page.getByRole('button', { name: 'Подтвердить заказ' }).click()

  await expect(page).toHaveURL(/\/order\/\d{6}\?new=1/)
  await expect(page.getByRole('heading', { name: /Заказ №\d{6} оформлен/ })).toBeVisible()
  await page.goto('/cart')
  await expect(page.getByText('В корзине пока пусто')).toBeVisible()
})

test('admin area requires login', async ({ page }) => {
  await page.goto('/admin/orders')
  await expect(page).toHaveURL(/\/admin\/login$/)
  await page.getByLabel('Пароль').fill('wrong')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByText('Неверный пароль')).toBeVisible()
  await page.getByLabel('Пароль').fill('e2e-pass')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('heading', { name: /Товары/ })).toBeVisible()
})
