import type { Metadata } from 'next'
import { Onest, Unbounded } from 'next/font/google'
import { mantineHtmlProps } from '@mantine/core'
import { SHOP_NAME } from '@/lib/config'

const onest = Onest({ subsets: ['latin', 'cyrillic'], variable: '--font-onest' })
const unbounded = Unbounded({ subsets: ['latin', 'cyrillic'], variable: '--font-unbounded', weight: ['500', '700', '800'] })

export const metadata: Metadata = {
  title: { default: SHOP_NAME, template: `%s — ${SHOP_NAME}` },
  description: 'Одежда и обувь напрямую от производителя',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" {...mantineHtmlProps} className={`${onest.variable} ${unbounded.variable}`}>
      <body>{children}</body>
    </html>
  )
}
