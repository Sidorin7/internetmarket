export type Sort = 'new' | 'cheap' | 'expensive'
export type Filters = {
  q?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  size?: string
  sort: Sort
  page: number
}
export type RawParams = Record<string, string | string[] | undefined>

export const PAGE_SIZE = 24
const MAX_PAGE = 50

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

function rublesToKopecks(v: string | undefined): number | undefined {
  if (!v) return undefined
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined
}

export function parseFilters(params: RawParams, category?: string): Filters {
  const q = first(params.q)?.trim().slice(0, 100) || undefined
  const sortRaw = first(params.sort)
  const sort: Sort = sortRaw === 'cheap' || sortRaw === 'expensive' ? sortRaw : 'new'
  const pageNum = Number.parseInt(first(params.page) ?? '1', 10)
  const page = Number.isFinite(pageNum) && pageNum >= 1 ? Math.min(pageNum, MAX_PAGE) : 1
  let minPrice = rublesToKopecks(first(params.min))
  let maxPrice = rublesToKopecks(first(params.max))
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    ;[minPrice, maxPrice] = [maxPrice, minPrice]
  }
  const size = first(params.size)?.trim().slice(0, 20) || undefined
  return { q, category, minPrice, maxPrice, size, sort, page }
}

export function buildQuery(params: RawParams, patch: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const v = first(value)
    if (v && !(key in patch)) sp.set(key, v)
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined && value !== '') sp.set(key, String(value))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}
