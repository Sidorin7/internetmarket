import { OrdersTable } from '@/components/admin/OrdersTable'
import { db } from '@/db/client'
import { listOrders } from '@/features/admin/orders'

export default function AdminOrdersPage() {
  return <OrdersTable rows={listOrders(db)} />
}
