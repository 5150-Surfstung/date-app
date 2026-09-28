export const HANDLE_RE = /^[a-z0-9_]{3,20}$/

export const RESERVED = new Set([
  'date', 'vibe', 'spot', 'night', 'hey', 'preview', 'chat', 'claim', 'apply', 'at', 'badge',
  'admin', 'help', 'support', 'about', 'team', 'nights', 'spots', 'me', 'demo',
  'looking', 'casual', 'fun', 'tonight', 'intown', 'slow', 'open', 'curious',
])

export function normalizeHandle(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
}

export type Visibility = 'public' | 'private' | 'tonight'

// The curated vocabulary. Users pick, never type. This list is the brand.
export type Tag = 'looking' | 'casual' | 'fun' | 'tonight' | 'intown' | 'slow' | 'open' | 'curious'

export const TAGS: { value: Tag; line: string }[] = [
  { value: 'looking', line: 'The real thing. Not pretending otherwise.' },
  { value: 'casual', line: 'Good company. No pressure.' },
  { value: 'fun', line: 'Say yes to the plan.' },
  { value: 'tonight', line: 'Here now. Gone at midnight.' },
  { value: 'intown', line: 'New here, or just visiting. Show me around.' },
  { value: 'slow', line: 'No rush. Get it right.' },
  { value: 'open', line: 'Not sure yet. Honest about it.' },
  { value: 'curious', line: 'First time doing this. Be cool.' },
]

export function tagLine(tag?: string | null) {
  return TAGS.find((t) => t.value === tag)?.line ?? ''
}

// Where /at links and badge QR codes point. Set NEXT_PUBLIC_SITE_URL at build
// (includes the base path); falls back to the current origin.
export function siteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL
  if (env) return env.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export function heyUrl(handle: string) {
  return `${siteUrl()}/at/?h=${encodeURIComponent(handle)}`
}

export const EMAIL_KEY = 'date:email'
export const HANDLE_KEY = 'date:handle'
