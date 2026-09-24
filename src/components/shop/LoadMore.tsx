import Link from 'next/link'

export function LoadMore({ href, shown, total }: { href: string; shown: number; total: number }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-2">
      <p className="text-sm text-muted">Показано {shown} из {total}</p>
      <Link href={href} scroll={false} className="rounded-2xl bg-brand-500 px-8 py-3 font-semibold text-white hover:bg-brand-600">
        Показать ещё
      </Link>
    </div>
  )
}
