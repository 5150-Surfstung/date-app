export const HANDLE_RE = /^[a-z0-9_]{3,20}$/

export const RESERVED = new Set([
  'date', 'vibe', 'spot', 'night', 'hey', 'preview', 'chat', 'claim', 'apply', 'at', 'badge',
  'admin', 'help', 'support', 'about', 'team', 'nights', 'spots', 'me', 'demo',
  'looking', 'casual', 'fun', 'tonight', 'intown', 'slow', 'open', 'curious', 'chill', 'frisky',
  'pool', 'partner', 'kit', 'login', 'inbox', 'console', 'val', 'status', 'offline', 'receipts',
  'founding', 'privacy', 'terms', 'unsub', 'settings', 'edit', 'home', 'guide', 'trending', 'couples', 'share', 'read',
])

export function normalizeHandle(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
}

export type Visibility = 'public' | 'private' | 'tonight'

// Vibes are yours. The core words are one tap; anyone can make their own
// (/tacos, /rooftop, /dogdad). Change them whenever. Three at most, first leads.
export type Tag = string
export type CoreTag = 'looking' | 'casual' | 'fun' | 'tonight' | 'intown' | 'slow' | 'open' | 'curious' | 'chill' | 'frisky'

export const TAGS: { value: CoreTag; line: string }[] = [
  { value: 'looking', line: 'The real thing. Not pretending otherwise.' },
  { value: 'casual', line: 'Good company. No pressure.' },
  { value: 'fun', line: 'Say yes to the plan.' },
  { value: 'tonight', line: 'Out tonight. Let’s see.' },
  { value: 'chill', line: 'Low key. Good conversation, no production.' },
  { value: 'frisky', line: 'Feeling it. You’ll know.' },
  { value: 'intown', line: 'New here, or just visiting. Show me around.' },
  { value: 'slow', line: 'No rush. Get it right.' },
  { value: 'open', line: 'Not sure yet. Honest about it.' },
  { value: 'curious', line: 'First time doing this. Be cool.' },
]

// Charleston, as slashes. Local pride spreads: "/follybeach tonight."
export const LOCAL: { value: string; place: string }[] = [
  { value: 'follybeach', place: 'Folly Beach' }, { value: 'kingst', place: 'King Street' }, { value: 'upperking', place: 'Upper King' },
  { value: 'shemcreek', place: 'Shem Creek' }, { value: 'sullys', place: 'Sullivan’s Island' }, { value: 'iop', place: 'Isle of Palms' },
  { value: 'mtpleasant', place: 'Mount Pleasant' }, { value: 'parkcircle', place: 'Park Circle' }, { value: 'westashley', place: 'West Ashley' },
  { value: 'jamesisland', place: 'James Island' }, { value: 'danielisland', place: 'Daniel Island' }, { value: 'thebattery', place: 'The Battery' },
  { value: 'marionsquare', place: 'Marion Square' }, { value: 'rainbowrow', place: 'Rainbow Row' }, { value: 'rooftop', place: 'Any rooftop' },
]

// Same quiet safety net as the database (date_vibe_blocked).
const VIBE_BLOCK = /\d{5,}|http|www|\.com|\.net|cashapp|venmo|paypal|zelle|onlyfans|fansly|sugardaddy|sugarbaby|forsale|pricelist|donation|escort|pay4|payfor|teen|underage|minor|loli|schoolgirl|jailbait|nigg|faggot|fagg|tranny|retard|kike|chink|wetback|raghead|^coon|^spic$|^spick/

/** "/Sweet Tea!" → "sweettea". Empty if it can't be a vibe. */
export function cleanVibe(raw: string) {
  return raw.toLowerCase().replace(/^\/+/, '').replace(/[^a-z0-9]/g, '').slice(0, 20)
}
/** Why a vibe can't be used, or null if it's fine. */
export function vibeProblem(v: string): string | null {
  if (v.length < 2) return 'Two letters at least.'
  if (VIBE_BLOCK.test(v)) return 'That one’s not allowed here.'
  return null
}

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

// Clean short link on Vercel; query-param form on the static export.
export function heyUrl(handle: string) {
  const h = encodeURIComponent(handle)
  return process.env.NEXT_PUBLIC_STATIC_EXPORT
    ? `${siteUrl()}/at/?h=${h}`
    : `${siteUrl()}/${h}`
}

export const EMAIL_KEY = 'date:email'
export const HANDLE_KEY = 'date:handle'
