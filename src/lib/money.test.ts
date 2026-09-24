import { describe, expect, it } from 'vitest'
import { discountPercent, formatPrice } from './money'

const norm = (s: string) => s.replace(/\s/g, ' ')

describe('formatPrice', () => {
  it('formats kopecks as rubles with thin spaces', () => {
    expect(norm(formatPrice(299000))).toBe('2 990 ₽')
    expect(norm(formatPrice(12345600))).toBe('123 456 ₽')
    expect(norm(formatPrice(0))).toBe('0 ₽')
  })
})

describe('discountPercent', () => {
  it('returns rounded percent when old price is higher', () => {
    expect(discountPercent(70000, 100000)).toBe(30)
  })
  it('returns null without a real discount', () => {
    expect(discountPercent(100000, null)).toBeNull()
    expect(discountPercent(100000, 100000)).toBeNull()
    expect(discountPercent(100000, 90000)).toBeNull()
  })
})
