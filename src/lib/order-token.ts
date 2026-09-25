import { createHmac, timingSafeEqual } from 'node:crypto'

// Номера заказов идут подряд, поэтому страница заказа открывается только по подписанной ссылке
export function orderToken(number: string): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return createHmac('sha256', secret).update(`order:${number}`).digest('base64url').slice(0, 22)
}

export function verifyOrderToken(number: string, token: string | undefined): boolean {
  if (!token) return false
  const expected = Buffer.from(orderToken(number))
  const given = Buffer.from(token)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
