import '../globals.css'
import { Header } from '@/components/shop/Header'
import { db } from '@/db/client'
import { getCategories } from '@/features/catalog/queries'
import { SHOP_NAME } from '@/lib/config'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const categories = getCategories(db)
  return (
    <>
      <Header categories={categories} />
      <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-6">{children}</main>
      <footer className="mt-16 bg-surface py-10 text-center text-sm text-muted">
        © {new Date().getFullYear()} {SHOP_NAME}. Шьём сами — продаём напрямую.
      </footer>
    </>
  )
}
