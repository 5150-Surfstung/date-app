import type { Metadata, Viewport } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'
import Pwa from './pwa'

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '800'],
  variable: '--font-sora',
  display: 'swap',
})

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://date-surfstung-systems.vercel.app'),
  openGraph: { siteName: '/date', type: 'website', title: '/date — Your vibe is your profile.', description: 'Three matches. No games. Real people. Matchmaking with Val, in Charleston.' },
  twitter: { card: 'summary_large_image' },
  title: '/date — Your vibe is your profile.',
  description:
    'Three matches. No games. Real people. We pick your people and set up the date.',
  applicationName: '/date',
  manifest: `${base}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: '/date', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
  other: { 'mobile-web-app-capable': 'yes' },
}

export const viewport: Viewport = {
  themeColor: '#FF3B2F',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sora.variable}>
      <body className="font-mono antialiased min-h-dvh">
        {children}
        <Pwa />
      </body>
    </html>
  )
}
