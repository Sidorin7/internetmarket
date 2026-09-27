import type { OrderStatus } from '@/db/schema'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Оформлен',
  confirmed: 'Подтверждён',
  shipped: 'Отправлен',
  cancelled: 'Отменён',
}

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' })

export function formatDate(d: Date): string {
  return dateFmt.format(d)
}
