import 'server-only'
import { headers } from 'next/headers'

// На Vercel x-real-ip / x-forwarded-for выставляет сама платформа, подделать их из браузера нельзя
export async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}
