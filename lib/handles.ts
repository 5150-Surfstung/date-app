export const HANDLE_RE = /^[a-z0-9_]{3,20}$/

export const RESERVED = new Set([
  'date', 'vibe', 'spot', 'night', 'hey', 'preview', 'claim', 'apply', 'at', 'badge',
  'admin', 'help', 'support', 'about', 'team', 'nights', 'spots', 'me',
])

export function normalizeHandle(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
}

export type Visibility = 'public' | 'private' | 'tonight'

export const VISIBILITY: { value: Visibility; label: string; body: string }[] = [
  { value: 'public', label: 'Public', body: 'Anyone with your /name can send a /hey. You see their /vibe first.' },
  { value: 'tonight', label: 'Tonight only', body: 'Works until midnight, then goes dark. Give it out freely.' },
  { value: 'private', label: 'Private', body: 'Shows nothing. Only matchmaker intros reach you.' },
]

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
