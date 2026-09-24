const LETTERS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

function rank(size: string): [number, number] {
  const i = LETTERS.indexOf(size.toUpperCase())
  if (i >= 0) return [0, i]
  const n = Number.parseFloat(size)
  if (Number.isFinite(n)) return [1, n]
  return [2, 0]
}

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const [ga, va] = rank(a)
    const [gb, vb] = rank(b)
    return ga - gb || va - vb || a.localeCompare(b)
  })
}
