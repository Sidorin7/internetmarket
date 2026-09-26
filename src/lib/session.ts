import { createHash, timingSafeEqual } from 'node:crypto'
import { jwtVerify, SignJWT } from 'jose'

export const SESSION_COOKIE = 'admin_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

const PLACEHOLDERS = ['replace-with', 'change-me', 'changeme', 'secret', 'xxxxx']

// Репозиторий публичный: значения из .env.example известны всем, поэтому в проде они запрещены
export function weakConfigReason(env: Record<string, string | undefined> = process.env): string | null {
  if (env.NODE_ENV !== 'production') return null
  const secret = env.SESSION_SECRET ?? ''
  if (secret.length < 32 || PLACEHOLDERS.some((p) => secret.toLowerCase().includes(p))) {
    return 'SESSION_SECRET не задан или взят из .env.example — сгенерируйте: openssl rand -base64 48'
  }
  const password = env.ADMIN_PASSWORD ?? ''
  if (password.length < 12 || PLACEHOLDERS.some((p) => password.toLowerCase().includes(p))) {
    return 'ADMIN_PASSWORD слишком простой — нужно не меньше 12 символов и не значение из .env.example'
  }
  return null
}

function key() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters')
  const weak = weakConfigReason()
  if (weak) throw new Error(weak)
  return new TextEncoder().encode(secret)
}

export async function signSession(): Promise<string> {
  return new SignJWT({ role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(key())
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, key())
    return payload.role === 'admin'
  } catch {
    return false
  }
}

export const USER_COOKIE = 'user_session'
export const USER_MAX_AGE = 60 * 60 * 24 * 30

export async function signUserSession(userId: number): Promise<string> {
  return new SignJWT({ role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key())
}

export async function verifyUserSession(token: string | undefined): Promise<number | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key())
    if (payload.role !== 'user' || !payload.sub || !/^\d+$/.test(payload.sub)) return null
    return Number(payload.sub)
  } catch {
    return null
  }
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const weak = weakConfigReason()
  if (weak) {
    console.error(`[admin] вход отключён: ${weak}`)
    return false
  }
  const a = createHash('sha256').update(input).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}
