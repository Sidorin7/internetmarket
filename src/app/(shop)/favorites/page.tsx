import { FavoritesView } from './FavoritesView'

export const metadata = { title: 'Избранное' }

export default function FavoritesPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Избранное</h1>
      <FavoritesView />
    </div>
  )
}
