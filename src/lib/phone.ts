export function normalizePhone(input: string): string | null {
  const d = input.replace(/\D/g, '')
  if (d.length === 11 && (d[0] === '7' || d[0] === '8')) return `+7${d.slice(1)}`
  if (d.length === 10 && d[0] === '9') return `+7${d}`
  return null
}

export function formatPhone(e164: string): string {
  const d = e164.replace(/\D/g, '').slice(1)
  return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`
}
