import { describe, expect, it, vi } from 'vitest'
import type { OrderSummary } from '@/features/orders/types'
import { renderCustomerEmail, renderSellerEmail, sendOrderEmails, type SendFn } from './mail'

const order: OrderSummary = {
  id: 1,
  number: '100001',
  customerName: '<script>alert(1)</script> Анна',
  phone: '+79001234567',
  email: 'anna@example.com',
  address: 'Москва, ул. Ленина, 1',
  comment: 'Позвонить <b>заранее</b>',
  total: 1297000,
  createdAt: new Date('2026-09-24T10:00:00Z'),
  items: [
    { title: 'Льняное платье', size: 'S', price: 499000, qty: 2 },
    { title: 'Кеды белые', size: '40', price: 299000, qty: 1 },
  ],
}
const norm = (s: string) => s.replace(/\s/g, ' ')

describe('renderSellerEmail', () => {
  it('contains number, phone and items', () => {
    const m = renderSellerEmail(order)
    expect(norm(m.subject)).toBe('Новый заказ №100001 — 12 970 ₽')
    expect(m.text).toContain('+7 900 123-45-67')
    expect(norm(m.text)).toContain('Льняное платье (S) × 2 = 9 980 ₽')
    expect(m.html).toContain('tel:+79001234567')
  })

  it('escapes customer input in html', () => {
    const { html } = renderSellerEmail(order)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&lt;b&gt;заранее&lt;/b&gt;')
  })
})

describe('renderCustomerEmail', () => {
  it('confirms order to customer', () => {
    const m = renderCustomerEmail(order)
    expect(m.subject).toContain('№100001')
    expect(norm(m.text)).toContain('Итого: 12 970 ₽')
  })
})

describe('sendOrderEmails', () => {
  it('sends to seller and customer', async () => {
    const send = vi.fn<SendFn>().mockResolvedValue(undefined)
    expect(await sendOrderEmails(order, { send, sellerEmail: 'seller@shop.ru' })).toBe(true)
    expect(send.mock.calls.map((c) => c[0].to)).toEqual(['seller@shop.ru', 'anna@example.com'])
  })

  it('returns false when smtp fails, without throwing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const send = vi.fn<SendFn>().mockRejectedValue(new Error('ECONNREFUSED'))
    expect(await sendOrderEmails(order, { send, sellerEmail: 'seller@shop.ru' })).toBe(false)
  })
})
