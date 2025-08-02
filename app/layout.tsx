import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ReLinked - Modern URL Shortener',
  description: 'Shorten URLs with style. Get detailed analytics and AI-powered insights.',
  keywords: 'url shortener, link shortener, analytics, qr code',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen pattern-bg">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
