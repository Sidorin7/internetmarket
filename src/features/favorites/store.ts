import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type FavoritesState = {
  ids: number[]
  // true, пока пользователь вошёл и список совпадает с серверным
  synced: boolean
  toggle: (productId: number) => void
  remove: (productId: number) => void
  replaceFromServer: (ids: number[]) => void
  reset: () => void
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => {
      const push = (id: number, on: boolean) => {
        if (!get().synced) return
        // динамический импорт: гостям модуль server action не нужен, а тестам стора — не по силам
        import('./actions')
          .then(({ setFavoriteAction }) => setFavoriteAction(id, on))
          .then((ok) => {
            if (!ok) set({ synced: false })
          })
          .catch(() => {})
      }
      return {
        ids: [],
        synced: false,
        toggle: (id) => {
          const on = !get().ids.includes(id)
          set((s) => ({ ids: on ? [id, ...s.ids] : s.ids.filter((x) => x !== id) }))
          push(id, on)
        },
        remove: (id) => {
          set((s) => ({ ids: s.ids.filter((x) => x !== id) }))
          push(id, false)
        },
        replaceFromServer: (ids) => set({ ids, synced: true }),
        reset: () => set({ ids: [], synced: false }),
      }
    },
    { name: 'favorites-v1' },
  ),
)
