import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = { variantId: number; productId: number; qty: number }

type CartState = {
  items: CartItem[]
  add: (item: { variantId: number; productId: number }, qty?: number, max?: number) => void
  setQty: (variantId: number, qty: number, max?: number) => void
  remove: (variantId: number) => void
  removeMany: (variantIds: number[]) => void
  clear: () => void
}

const HARD_MAX = 99
const clamp = (qty: number, max = HARD_MAX) => Math.max(0, Math.min(qty, max, HARD_MAX))

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: ({ variantId, productId }, qty = 1, max) =>
        set((s) => {
          const existing = s.items.find((i) => i.variantId === variantId)
          if (existing) {
            return { items: s.items.map((i) => (i.variantId === variantId ? { ...i, qty: clamp(i.qty + qty, max) } : i)) }
          }
          const q = clamp(qty, max)
          return q > 0 ? { items: [...s.items, { variantId, productId, qty: q }] } : s
        }),
      setQty: (variantId, qty, max) =>
        set((s) => {
          const q = clamp(qty, max)
          return {
            items: q < 1 ? s.items.filter((i) => i.variantId !== variantId) : s.items.map((i) => (i.variantId === variantId ? { ...i, qty: q } : i)),
          }
        }),
      remove: (variantId) => set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),
      removeMany: (variantIds) => set((s) => ({ items: s.items.filter((i) => !variantIds.includes(i.variantId)) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'cart-v1' },
  ),
)

export const selectCartCount = (s: CartState) => s.items.reduce((n, i) => n + i.qty, 0)

// Запрошенные размеры, которых сервер больше не знает (товар или размер удалён из админки)
export const missingVariantIds = (requested: number[], lines: { variantId: number }[]) => {
  const known = new Set(lines.map((l) => l.variantId))
  return requested.filter((id) => !known.has(id))
}
