export type OrderItemSummary = { title: string; size: string; price: number; qty: number }
export type OrderSummary = {
  id: number
  number: string
  customerName: string
  phone: string
  email: string
  address: string
  comment: string
  total: number
  createdAt: Date
  items: OrderItemSummary[]
}
