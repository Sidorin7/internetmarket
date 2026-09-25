import '@mantine/core/styles.css'
import '@mantine/dropzone/styles.css'
import '@mantine/notifications/styles.css'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'

export const metadata = { title: 'Админка', robots: { index: false } }

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider forceColorScheme="light" theme={{ primaryColor: 'violet', fontFamily: 'var(--font-onest), sans-serif' }}>
      <Notifications position="top-right" />
      {children}
    </MantineProvider>
  )
}
