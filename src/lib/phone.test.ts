import { describe, expect, it } from 'vitest'
import { formatPhone, normalizePhone } from './phone'

describe('normalizePhone', () => {
  it.each([
    ['+7 (900) 123-45-67', '+79001234567'],
    ['89001234567', '+79001234567'],
    ['9001234567', '+79001234567'],
    ['7 900 123 45 67', '+79001234567'],
  ])('%s → %s', (input, out) => expect(normalizePhone(input)).toBe(out))

  it.each(['', '123', '+1 555 123 4567', 'телефон', '8900123456789'])('rejects %s', (input) =>
    expect(normalizePhone(input)).toBeNull(),
  )
})

it('formatPhone', () => {
  expect(formatPhone('+79001234567')).toBe('+7 900 123-45-67')
})
