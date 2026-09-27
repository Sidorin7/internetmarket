import { describe, expect, it, vi } from 'vitest'
import { renderCancelEmail, renderLoginCodeEmail, sendCancelEmail, sendLoginCode } from './mail'

describe('login code email', () => {
  it('puts the code in subject, text and html', () => {
    const m = renderLoginCodeEmail('042917')
    expect(m.subject).toContain('042917')
    expect(m.text).toContain('042917')
    expect(m.html).toContain('042917')
  })
  it('sends to the given address and propagates SMTP errors', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    await sendLoginCode('a@a.ru', '123456', send)
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@a.ru' }))
    await expect(sendLoginCode('a@a.ru', '1', vi.fn().mockRejectedValue(new Error('smtp down')))).rejects.toThrow('smtp down')
  })
})

describe('cancel email', () => {
  const order = { number: '100007', customerName: '<b>Анна</b>', phone: '+79001234567', total: 499000 }
  it('escapes customer data', () => {
    const m = renderCancelEmail(order)
    expect(m.subject).toContain('100007')
    expect(m.html).toContain('&lt;b&gt;Анна&lt;/b&gt;')
    expect(m.html).not.toContain('<b>Анна</b>')
  })
  it('goes to the seller, skipped without SELLER_EMAIL', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    await sendCancelEmail(order, { send, sellerEmail: 's@shop.ru' })
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 's@shop.ru' }))
    const none = vi.fn()
    await sendCancelEmail(order, { send: none, sellerEmail: '' })
    expect(none).not.toHaveBeenCalled()
  })
})
