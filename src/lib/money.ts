const rub = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

export function formatPrice(kopecks: number): string {
  return `${rub.format(Math.round(kopecks / 100))} ₽`
}

export function discountPercent(price: number, oldPrice: number | null | undefined): number | null {
  if (!oldPrice || oldPrice <= price) return null
  return Math.round((1 - price / oldPrice) * 100)
}
