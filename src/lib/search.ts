export function normalizeSearch(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()
}

export function buildSearchText(title: string, description: string): string {
  return normalizeSearch(`${title} ${description}`)
}

export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`)
}
