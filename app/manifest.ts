import type { MetadataRoute } from 'next'

// The install manifest. Paths carry the base path so the GitHub Pages
// mirror (/date-app) installs too.
const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '/date',
    short_name: '/date',
    description: 'Your /vibe is your profile. Three matches. No games. Real people.',
    id: `${base}/`,
    start_url: `${base}/?source=pwa`,
    scope: `${base}/`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FF3B2F',
    theme_color: '#FF3B2F',
    categories: ['social', 'lifestyle'],
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${base}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${base}/icons/maskable-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: `${base}/icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Inbox', url: `${base}/inbox/`, description: 'Your /heys and /wings' },
      { name: '/chat', url: `${base}/chat/`, description: 'Open chats' },
      { name: 'My badge', url: `${base}/me/`, description: 'Your /name and QR' },
    ],
  }
}
