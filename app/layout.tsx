import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Mono } from 'next/font/google'
import './globals.css'

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-display',
})

const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: '/date — Your vibe is your profile.',
  description:
    'Three matches. No games. Real people. AI-native matchmaking, one city at a time.',
}

export const viewport: Viewport = {
  themeColor: '#0C0B09',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="font-mono antialiased min-h-screen">{children}</body>
    </html>
  )
}
