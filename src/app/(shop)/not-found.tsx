import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="font-display text-7xl font-extrabold text-brand-500">404</p>
      <p className="mt-3 text-lg">Такой страницы нет — возможно, товар уже раскупили</p>
      <Link href="/" className="mt-6 inline-block rounded-2xl bg-brand-500 px-6 py-3 font-semibold text-white">На главную</Link>
    </div>
  )
}
