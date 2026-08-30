import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'OrderlyQR • WhatsApp-Integrated Digital Ordering Platform',
    template: '%s | OrderlyQR'
  },
  description: 'Scan table QR codes, view digital menus, and place orders instantly. Features real-time kitchen order tickets (KOT) and WhatsApp notifications.',
  keywords: ['QR code ordering', 'restaurant menu', 'digital ordering', 'KOT', 'WhatsApp restaurant orders', 'OrderlyQR'],
  authors: [{ name: 'OrderlyQR Team' }],
  openGraph: {
    title: 'OrderlyQR • Contactless Digital Ordering & Kitchen Management',
    description: 'Instant QR menu ordering, kitchen ticket management, and WhatsApp receipts for modern dining.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://orderlyqr.com',
    siteName: 'OrderlyQR',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OrderlyQR • Digital Restaurant Platform',
    description: 'Instant QR menu ordering, kitchen ticket management, and WhatsApp receipts.',
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  )
}
