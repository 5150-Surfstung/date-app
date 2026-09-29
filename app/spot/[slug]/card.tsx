'use client'

// A /date spot's profile card: cover, who they are, and every way to get there
// or follow them, like their own link page, in /date's look.
import { useEffect, useState } from 'react'
import { SPOT_KINDS, directionsUrl, siteUrl, type Venue } from '@/lib/venues'
import { rpc } from '@/lib/rest'

const kindLabel = (k: string | null) => SPOT_KINDS.find(([v]) => v === k)?.[1] ?? null
const photoUrl = (key: string) =>
  /^https?:/.test(key) ? key : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/date-spots/${key}`

const I = {
  go: <path d="M12 2 4.5 20.3l.7.7L12 18l6.8 3 .7-.7z" />,
  call: <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />,
  web: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-3a15.6 15.6 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8ZM12 4a14 14 0 0 1 1.9 4h-3.8A14 14 0 0 1 12 4ZM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4Zm.8 2h3a15.6 15.6 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16Zm3-8h-3a8 8 0 0 1 4.4-3.6A15.6 15.6 0 0 0 8.1 8ZM12 20a14 14 0 0 1-1.9-4h3.8A14 14 0 0 1 12 20Zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4Zm.2 5.6a15.6 15.6 0 0 0 1.4-3.6h3a8 8 0 0 1-4.4 3.6Zm1.8-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4Z" />,
  ig: <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 2c-2.7 0-3 0-4.1.06C4.3 2.2 2.2 4.3 2.06 7.9 2 9 2 9.3 2 12s0 3 .06 4.1c.16 3.6 2.24 5.7 5.84 5.84C9 22 9.3 22 12 22s3 0 4.1-.06c3.6-.16 5.7-2.24 5.84-5.84C22 15 22 14.7 22 12s0-3-.06-4.1C21.8 4.3 19.7 2.2 16.1 2.06 15 2 14.7 2 12 2Zm0 1.8c2.7 0 3 0 4 .06 2.7.12 4 1.42 4.14 4.14.05 1.06.06 1.37.06 4s0 3-.06 4c-.12 2.7-1.4 4-4.14 4.14-1.06.05-1.37.06-4 .06s-3 0-4-.06C5.3 20 4 18.7 3.86 16c-.05-1.06-.06-1.37-.06-4s0-3 .06-4C4 5.3 5.3 4 8 3.86c1.06-.05 1.37-.06 4-.06Z" />,
  tt: <path d="M16.6 2h-3.3v13.3a2.9 2.9 0 1 1-2-2.75V9.2a6.2 6.2 0 1 0 5.3 6.1V8.6a7.6 7.6 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.4Z" />,
}
const Icon = ({ d }: { d: JSX.Element }) => <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" aria-hidden>{d}</svg>

export function SpotCard({ venue: v }: { venue: Venue }) {
  // "N on /date here now" only once there's a crowd; one or two people stay invisible.
  const [here, setHere] = useState(0)
  useEffect(() => { rpc<number>('night_count', { p_slug: v.slug }).then(({ data }) => setHere(data ?? 0)) }, [v.slug])

  const dir = directionsUrl(v)
  const links: { href: string; label: string; icon: JSX.Element; main?: boolean }[] = [
    ...(dir ? [{ href: dir, label: 'Directions', icon: I.go, main: true }] : []),
    ...(v.phone ? [{ href: `tel:${v.phone.replace(/[^\d+]/g, '')}`, label: 'Call', icon: I.call }] : []),
    ...(v.website ? [{ href: siteUrl(v.website), label: 'Website', icon: I.web }] : []),
    ...(v.instagram ? [{ href: `https://instagram.com/${v.instagram}`, label: `@${v.instagram}`, icon: I.ig }] : []),
    ...(v.tiktok ? [{ href: `https://tiktok.com/@${v.tiktok}`, label: 'TikTok', icon: I.tt }] : []),
  ]
  const meta = [kindLabel(v.kind), v.area].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col gap-5">
      <div className={`relative overflow-hidden rounded-[2rem] ${v.photo ? 'aspect-[4/5] sm:aspect-[4/3]' : 'bg-ob'} text-white`}>
        {v.photo && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(v.photo)} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          </>
        )}
        <div className={`${v.photo ? 'absolute inset-x-0 bottom-0' : 'relative'} p-6 sm:p-8`}>
          <div className="flex flex-wrap items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-extrabold">
            <span className="rounded-full bg-white text-ob px-3 py-1">/date spot</span>
            {here >= 3 && <span className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1"><span className="live-dot" aria-hidden />{here} here now</span>}
          </div>
          <h1 className="mt-4 font-display font-extrabold text-5xl sm:text-7xl leading-[0.9] tracking-[-0.04em] break-words">{v.name}</h1>
          {meta && <p className="mt-2 text-base font-semibold text-white/85">{meta}</p>}
          {v.about && <p className="mt-3 text-lg leading-snug text-white max-w-md">{v.about}</p>}
        </div>
      </div>

      {links.length > 0 && (
        <div className="grid gap-2">
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-3 rounded-full px-6 py-4 font-extrabold transition-transform active:scale-[0.98] hover:scale-[1.01] ${l.main ? 'bg-[#141414] text-white' : 'bg-white border-2 border-[#141414]/10'}`}>
              <Icon d={l.icon} />
              <span className="truncate">{l.label}</span>
              <span className="ml-auto opacity-40" aria-hidden>&rarr;</span>
            </a>
          ))}
        </div>
      )}

      {(v.address || v.hours) && (
        <div className="grid gap-1 text-sm text-[#141414]/70 px-2">
          {v.address && <p>{v.address}</p>}
          {v.hours && <p>{v.hours}</p>}
        </div>
      )}
    </div>
  )
}
