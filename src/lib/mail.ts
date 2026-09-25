import nodemailer from 'nodemailer'
import type { OrderSummary } from '@/features/orders/types'
import { SHOP_NAME } from './config'
import { formatPrice } from './money'
import { formatPhone } from './phone'

export type SendFn = (msg: { to: string; replyTo?: string; subject: string; text: string; html: string }) => Promise<unknown>
type Rendered = { subject: string; text: string; html: string }

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function itemsText(o: OrderSummary) {
  return o.items.map((i) => `• ${i.title} (${i.size}) × ${i.qty} = ${formatPrice(i.price * i.qty)}`).join('\n')
}

function itemsHtml(o: OrderSummary) {
  const rows = o.items
    .map(
      (i) => `<tr><td style="padding:6px 0">${escapeHtml(i.title)}</td><td style="padding:6px 12px">${escapeHtml(i.size)}</td>` +
        `<td style="padding:6px 12px">× ${i.qty}</td><td style="padding:6px 0;text-align:right">${formatPrice(i.price * i.qty)}</td></tr>`,
    )
    .join('')
  return `<table style="border-collapse:collapse;width:100%">${rows}<tr><td colspan="3" style="padding-top:12px;font-weight:bold">Итого</td>` +
    `<td style="padding-top:12px;text-align:right;font-weight:bold">${formatPrice(o.total)}</td></tr></table>`
}

const wrap = (body: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#16131f">` +
  `<div style="background:#5b34f0;color:#fff;padding:16px 20px;border-radius:12px;font-size:20px;font-weight:bold">${escapeHtml(SHOP_NAME)}</div>` +
  `<div style="padding:20px 4px">${body}</div></div>`

export function renderSellerEmail(o: OrderSummary): Rendered {
  const phone = formatPhone(o.phone)
  const text = [
    `Новый заказ №${o.number}`,
    '',
    `Покупатель: ${o.customerName}`,
    `Телефон: ${phone}`,
    `Email: ${o.email}`,
    `Адрес: ${o.address}`,
    o.comment ? `Комментарий: ${o.comment}` : null,
    '',
    itemsText(o),
    '',
    `Итого: ${formatPrice(o.total)}`,
  ]
    .filter((l): l is string => l !== null)
    .join('\n')
  const html = wrap(
    `<h2 style="margin:0 0 12px">Новый заказ №${o.number}</h2>` +
      `<p><b>${escapeHtml(o.customerName)}</b><br><a href="tel:${escapeHtml(o.phone)}">${phone}</a><br>` +
      `<a href="mailto:${escapeHtml(o.email)}">${escapeHtml(o.email)}</a><br>${escapeHtml(o.address)}</p>` +
      (o.comment ? `<p style="background:#f6f5fa;padding:10px;border-radius:8px">💬 ${escapeHtml(o.comment)}</p>` : '') +
      itemsHtml(o),
  )
  return { subject: `Новый заказ №${o.number} — ${formatPrice(o.total)}`, text, html }
}

export function renderCustomerEmail(o: OrderSummary): Rendered {
  const text = [
    `${o.customerName}, спасибо за заказ!`,
    '',
    `Номер заказа: ${o.number}`,
    'Мы свяжемся с вами по телефону для подтверждения.',
    '',
    itemsText(o),
    '',
    `Итого: ${formatPrice(o.total)}`,
    `Адрес доставки: ${o.address}`,
  ].join('\n')
  const html = wrap(
    `<h2 style="margin:0 0 12px">Спасибо за заказ!</h2>` +
      `<p>${escapeHtml(o.customerName)}, ваш заказ <b>№${o.number}</b> принят. Мы позвоним для подтверждения.</p>` +
      itemsHtml(o) +
      `<p style="color:#6f6a7d">Адрес доставки: ${escapeHtml(o.address)}</p>`,
  )
  return { subject: `Заказ №${o.number} принят — ${SHOP_NAME}`, text, html }
}

export function smtpOptions() {
  const port = Number(process.env.SMTP_PORT ?? 1025)
  return {
    host: process.env.SMTP_HOST ?? 'localhost',
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    // по умолчанию nodemailer ждёт приветствия 30 с, а ответа сокета — 10 минут
    connectionTimeout: 5000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  }
}

function smtpSend(): SendFn {
  const transport = nodemailer.createTransport(smtpOptions())
  return (msg) => transport.sendMail({ from: process.env.MAIL_FROM ?? `${SHOP_NAME} <shop@example.com>`, ...msg })
}

export async function sendOrderEmails(o: OrderSummary, opts: { send?: SendFn; sellerEmail?: string } = {}): Promise<boolean> {
  const send = opts.send ?? smtpSend()
  const sellerEmail = opts.sellerEmail ?? process.env.SELLER_EMAIL
  if (!sellerEmail) console.error('[mail] SELLER_EMAIL is not set')
  const jobs = [
    ...(sellerEmail ? [send({ to: sellerEmail, ...renderSellerEmail(o) })] : []),
    send({ to: o.email, replyTo: sellerEmail, ...renderCustomerEmail(o) }),
  ]
  const results = await Promise.allSettled(jobs)
  const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
  failed.forEach((r) => console.error(`[mail] order ${o.number}:`, r.reason))
  return failed.length === 0 && Boolean(sellerEmail)
}
