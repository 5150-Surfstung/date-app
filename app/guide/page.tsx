'use client'

// Val's Charleston. The guide nobody can buy their way into: ranked by what
// actually happens on /date (first dates that turn into seconds, where the
// crowd really goes), never by who paid. Counts only, never names.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { rpc } from '@/lib/rest'
import { SPOT_KINDS } from '@/lib/venues'

type S = { slug: string; name: string; area: string | null; kind: string | null; photo: string | null; about?: string | null; crowd?: string | null; dates?: number; seconds?: number; week?: number }
type Guide = { best: S[]; hot: S[]; fresh: S[]; all: S[]; trending: { vibe: string; people: number }[]; couples: number }

const kind = (k: string | null) => SPOT_KINDS.find(([v]) => v === k)?.[1] ?? null
const photoUrl = (key: string) => (/^https?:/.test(key) ? key : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/date-spots/${key}`)
const EMPTY: Guide = { best: [], hot: [], fresh: [], all: [], trending: [], couples: 0 }

function Card({ s, big, children }: { s: S; big?: boolean; children?: React.ReactNode }) {
  const meta = [kind(s.kind), s.area].filter(Boolean).join(' · ')
  return (
    <Link href={`/spot/${s.slug}/`} className={`group relative overflow-hidden rounded-[2rem] ${s.photo ? 'text-white' : 'bg-white'} ${big ? 'min-h-[18rem]' : 'min-h-[11rem]'} p-6 flex flex-col justify-end transition-transform active:scale-[0.98] hover:-rotate-[0.5deg]`}>
      {s.photo && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl(s.photo)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        </>
      )}
      <div className="relative">
        {children}
        <div className={`font-display font-extrabold ${big ? 'text-4xl sm:text-5xl' : 'text-3xl'} tracking-[-0.03em] leading-[0.95]`}>{s.name}</div>
        {meta && <div className={`mt-1 text-sm font-semibold ${s.photo ? 'text-white/80' : 'text-[#141414]/55'}`}>{meta}</div>}
        {s.about && <p className={`mt-2 text-sm ${s.photo ? 'text-white/90' : 'text-[#141414]/70'}`}>{s.about}</p>}
        {s.crowd && <div className="mt-3 inline-block rounded-full bg-ob text-white px-3 py-1 text-xs font-extrabold">the /{s.crowd} crowd</div>}
      </div>
    </Link>
  )
}

function Section({ title, line, children }: { title: string; line: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="font-display font-extrabold text-4xl sm:text-5xl tracking-[-0.035em] leading-[0.95]">{title}</h2>
      <p className="mt-2 text-lg text-[#141414]/65 max-w-xl">{line}</p>
      <div className="mt-6 grid sm:grid-cols-2 gap-3">{children}</div>
    </section>
  )
}

export default function GuidePage() {
  const [g, setG] = useState<Guide | null>(null)
  useEffect(() => { rpc<Guide>('val_guide').then(({ data }) => setG(data ?? EMPTY)) }, [])
  const share = () => {
    const url = location.href
    if (navigator.share) navigator.share({ title: 'Val’s Charleston', text: 'Where first dates in Charleston actually turn into seconds.', url }).catch(() => {})
    else navigator.clipboard?.writeText(url)
  }
  const shown = new Set([...(g?.best ?? []), ...(g?.hot ?? []), ...(g?.fresh ?? [])].map((s) => s.slug))
  const rest = (g?.all ?? []).filter((s) => !shown.has(s.slug))

  return (
    <main className="page min-h-dvh bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 pb-20">
      <header className="flex items-center justify-between pt-8 pb-10 max-w-5xl mx-auto">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <button onClick={share} className="rounded-full border-2 border-[#141414] px-4 py-2 text-sm font-extrabold">Share</button>
      </header>

      <div className="max-w-5xl mx-auto">
        <section className="max-w-3xl">
          <div className="text-xs tracking-[0.2em] uppercase font-extrabold text-ob">The guide nobody can pay to get into</div>
          <h1 className="mt-3 font-display font-extrabold text-[clamp(3.5rem,13vw,8rem)] leading-[0.88] tracking-[-0.05em]">Val&rsquo;s Charleston.</h1>
          <p className="mt-5 text-xl sm:text-2xl font-medium leading-snug max-w-2xl">Ranked by what actually happens: where first dates turn into seconds, and where the crowd really goes. Not reviews. Not ads. Receipts. <span className="text-ob">&mdash; Val</span></p>
        </section>

        {!g ? <p className="mt-12 text-lg">Asking around&hellip;</p> : (
          <>
            {g.best.length > 0 && (
              <Section title="Where first dates turn into seconds." line="The rooms that do half the work. Counted from real /seconds, not vibes.">
                {g.best.map((s, i) => (
                  <Card key={s.slug} s={s} big={i === 0}>
                    <div className="mb-3 font-display font-extrabold text-5xl sm:text-6xl text-ob tabular-nums leading-none">{s.seconds}<span className="text-2xl"> of {s.dates}</span></div>
                    <div className={`mb-2 text-xs font-extrabold uppercase tracking-[0.15em] ${s.photo ? 'text-white/80' : 'text-[#141414]/50'}`}>first dates became a /second</div>
                  </Card>
                ))}
              </Section>
            )}

            {g.hot.length > 0 && (
              <Section title="Busy this week." line="Where /date members actually went. Counts only; nobody gets named.">
                {g.hot.map((s) => (
                  <Card key={s.slug} s={s}>
                    <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-ob"><span className="live-dot" aria-hidden />{s.week} checked in this week</div>
                  </Card>
                ))}
              </Section>
            )}

            {g.trending.length > 0 && (
              <section className="mt-16">
                <h2 className="font-display font-extrabold text-4xl sm:text-5xl tracking-[-0.035em]">What Charleston is slashing.</h2>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1">
                  {g.trending.map((t, i) => (
                    <Link key={t.vibe} href={`/share/?v=${t.vibe}`} className={`font-display font-extrabold tracking-[-0.03em] ${i < 3 ? 'text-5xl sm:text-7xl' : 'text-3xl sm:text-4xl text-[#141414]/60'}`}>/{t.vibe}</Link>
                  ))}
                </div>
                <Link href="/trending/" className="mt-4 inline-block font-semibold underline underline-offset-4">All of it &rarr;</Link>
              </section>
            )}

            {g.fresh.length > 0 && (
              <Section title="New on /date." line="Approved by a person, not an algorithm. Be the first story out of these.">
                {g.fresh.map((s) => <Card key={s.slug} s={s} />)}
              </Section>
            )}

            {rest.length > 0 && (
              <Section title="Every /date spot." line="Each one approved by a person. If it's here, we'd send our own friends.">
                {rest.map((s) => <Card key={s.slug} s={s} />)}
              </Section>
            )}

            {g.all.length === 0 && (
              <section className="mt-14 max-w-xl rounded-[2rem] bg-white p-7">
                <div className="font-display font-extrabold text-3xl tracking-tight">The first pages are being written.</div>
                <p className="mt-2 text-lg text-[#141414]/70">The first /date spots are opening now. This guide fills in with every first date, every /second and every busy night. Nobody can pay to be on it.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/claim/" className="bg-ob text-white rounded-full px-6 py-3 font-extrabold">Claim your /name</Link>
                  <Link href="/partner/" className="border-2 border-[#141414] rounded-full px-6 py-3 font-extrabold">Run a great spot? Apply</Link>
                </div>
              </section>
            )}

            {g.couples > 0 && (
              <Link href="/couples/" className="mt-16 block rounded-[2rem] bg-ob text-white p-7">
                <div className="font-display font-extrabold text-6xl tabular-nums leading-none">{g.couples}</div>
                <div className="mt-1 font-display font-extrabold text-2xl">{g.couples === 1 ? 'couple' : 'couples'} found each other here. See the wall &rarr;</div>
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  )
}
