import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dostawio Connect - platforma zamówień B2B dla hurtowni',
  description: 'Dostawio Connect: platforma B2B dla hurtowni, klientów, cenników, zamówień i integracji.',
  icons: {
    icon: '/brand/dostawio-connect-icon.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
