'use client'

import { SlidersHorizontal, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import type { Filters as F } from '@/features/catalog/filters'

const SORTS = [
  { value: 'new', label: 'Новинки' },
  { value: 'cheap', label: 'Сначала дешевле' },
  { value: 'expensive', label: 'Сначала дороже' },
] as const

const rub = (k?: number) => (k === undefined ? '' : String(k / 100))
const input = 'h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-brand-500'

function FilterForm({ sizes, filters, action }: { sizes: string[]; filters: F; action: string }) {
  return (
    <form action={action} className="flex flex-col gap-6">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Сортировка</legend>
        <select name="sort" defaultValue={filters.sort} className={input} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Цена, ₽</legend>
        <div className="flex gap-2">
          <input name="min" inputMode="numeric" placeholder="от" defaultValue={rub(filters.minPrice)} className={input} />
          <input name="max" inputMode="numeric" placeholder="до" defaultValue={rub(filters.maxPrice)} className={input} />
        </div>
      </fieldset>
      {sizes.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Размер</legend>
          <div className="flex flex-wrap gap-2">
            {['', ...sizes].map((s) => (
              <label key={s || 'any'} className="cursor-pointer">
                <input type="radio" name="size" value={s} defaultChecked={(filters.size ?? '') === s} className="peer sr-only" />
                <span className="block rounded-xl border-2 border-line px-3 py-1.5 text-sm font-semibold peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700">
                  {s || 'Все'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="flex gap-2">
        <button type="submit" className="h-11 flex-1 rounded-xl bg-brand-500 font-semibold text-white hover:bg-brand-600">Показать</button>
        <a href={filters.q ? `${action}?q=${encodeURIComponent(filters.q)}` : action} className="grid h-11 place-items-center rounded-xl bg-surface px-4 text-sm font-semibold">Сбросить</a>
      </div>
    </form>
  )
}

export function Filters(props: { sizes: string[]; filters: F; action: string }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <FilterForm {...props} />
      </aside>
      <Dialog.Root>
        <Dialog.Trigger className="flex items-center gap-2 rounded-xl bg-surface px-4 py-2 text-sm font-semibold lg:hidden">
          <SlidersHorizontal className="size-4" /> Фильтры
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-[85vw] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <Dialog.Title className="font-display text-lg font-bold">Фильтры</Dialog.Title>
              <Dialog.Close aria-label="Закрыть"><X className="size-5" /></Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Сортировка, цена и размер</Dialog.Description>
            <FilterForm {...props} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
