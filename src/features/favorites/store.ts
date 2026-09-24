import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type FavoritesState = {
  ids: number[]
  toggle: (productId: number) => void
  remove: (productId: number) => void
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [id, ...s.ids] })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
    }),
    { name: 'favorites-v1' },
  ),
)
