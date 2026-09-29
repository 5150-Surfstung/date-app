// Link previews (1200×630): what iMessage, Instagram and friends show when a
// /date link is shared. Drawn by next/og in the house colors.
import { ImageResponse } from 'next/og'
import { vibeFor } from './vibes'

export const OG_SIZE = { width: 1200, height: 630 }

// Sora ExtraBold from Google Fonts (TrueType, which the renderer needs). If the
// fetch fails the card still renders in the default face.
async function sora(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch('https://fonts.googleapis.com/css2?family=Sora:wght@800', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Safari/534.30' },
    }).then((r) => r.text())
    const url = css.match(/src: url\((https:[^)]+)\) format\('(?:truetype|opentype)'\)/)?.[1]
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null
  } catch { return null }
}

export async function ogCard({ big, kicker, line, vibe }: { big: string; kicker: string; line: string; vibe?: string | null }) {
  const t = vibeFor(vibe || 'looking')
  const font = await sora()
  const word = big.length > 14 ? 96 : big.length > 10 ? 120 : 150
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: t.bg, color: t.fg, ...(font ? { fontFamily: 'Sora' } : {}) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2 }}>/date</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 4, opacity: 0.7 }}>CHARLESTON</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 5, opacity: 0.7 }}>{kicker.toUpperCase()}</div>
          <div style={{ fontSize: word, fontWeight: 800, letterSpacing: -6, lineHeight: 1, marginTop: 12 }}>{big}</div>
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, opacity: 0.85 }}>{line}</div>
      </div>
    ),
    { ...OG_SIZE, fonts: font ? [{ name: 'Sora', data: font, weight: 800, style: 'normal' }] : undefined },
  )
}

/** Public read of a /name (same data the /name page shows). */
export async function wallFor(handle: string): Promise<{ open?: boolean; name?: string; tags?: string[] | null; tag?: string | null } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  try {
    const r = await fetch(`${url}/rest/v1/rpc/handle_wall`, {
      method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_handle: handle }), next: { revalidate: 600 },
    })
    return r.ok ? await r.json() : null
  } catch { return null }
}
