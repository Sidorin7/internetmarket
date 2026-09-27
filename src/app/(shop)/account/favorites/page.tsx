import { requireUser } from '@/lib/user'
import { FavoritesView } from '../../favorites/FavoritesView'

export const metadata = { title: 'Избранное', robots: { index: false } }

export default async function AccountFavoritesPage() {
  await requireUser('/account/favorites')
  return <FavoritesView />
}
