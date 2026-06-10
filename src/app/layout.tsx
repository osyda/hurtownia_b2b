import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import { Toaster } from 'sonner'
import { CookieConsent } from '@/components/legal/cookie-consent'
import './globals.css'

const sora = Sora({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Dostawio Connect - platforma zamówień B2B dla hurtowni',
  description: 'Dostawio Connect: platforma B2B dla hurtowni, klientów, cenników, zamówień i integracji.',
  icons: {
    icon: [
      { url: '/brand/favicon/favicon.ico' },
      { url: '/brand/favicon/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/brand/favicon/apple-touch-icon-180.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body className={sora.className}>
        {children}
        <CookieConsent />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
