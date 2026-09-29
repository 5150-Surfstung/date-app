import { ogCard, wallFor, OG_SIZE } from '@/lib/og'
import { DEMO_CREW } from '@/lib/demo'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'A /name on /date'
export const revalidate = 600

export function generateStaticParams() {
  return DEMO_CREW.map((d) => ({ handle: d.handle }))
}

export default async function Image({ params }: { params: { handle: string } }) {
  const h = params.handle.toLowerCase()
  const w = await wallFor(h)
  const tags = w?.open ? (w.tags?.length ? w.tags : w.tag ? [w.tag] : []) : []
  return ogCard({
    big: `/${h}`,
    kicker: tags.length ? tags.map((t) => `/${t}`).join(' ') : 'On /date',
    line: w?.open ? 'Send me a /hey. Val shows me your /vibe first.' : 'Matchmaking with Val. Real people only.',
    vibe: tags[0] ?? null,
  })
}
