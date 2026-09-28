import type { Metadata, Viewport } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '800'],
  variable: '--font-sora',
})

export const metadata: Metadata = {
  title: '/date — Your vibe is your profile.',
  description:
    'Three matches. No games. Real people. We pick your people and set up the date.',
}

export const viewport: Viewport = {
  themeColor: '#FF3B2F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sora.variable}>
      <body className="font-mono antialiased min-h-screen">{children}</body>
    </html>
  )
}
