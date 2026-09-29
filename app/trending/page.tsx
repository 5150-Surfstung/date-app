'use client'

// What Charleston is slashing this week. Sponsored vibes (a venue's night)
// sit on top, marked as such. A word only shows once three or more people use it.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { rpc } from '@/lib/rest'
import { LOCAL } from '@/lib/handles'

type Trend = {
  top: { vibe: string; people: number; sent: number; today: number }[]
  sponsored: { vibe: string; label: string | null; spot: string | null; spot_name: string | null; ends_at: string }[]
}

export default function TrendingPage() {
  const [t, setT] = useState<Trend | null>(null)
  useEffect(() => { rpc<Trend>('trending_vibes').then(({ data }) => setT(data ?? { top: [], sponsored: [] })) }, [])
  return (
    <main className="page min-h-dvh bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 pb-16">
      <header className="flex items-center justify-between pt-8 pb-10">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">Trending</span>
      </header>

      <section className="max-w-3xl">
        <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.04em]">What Charleston is slashing.</h1>
        <p className="mt-4 text-lg text-[#141414]/70">The vibes people are setting and sending this week. Say them out loud: &ldquo;slash tacos.&rdquo;</p>
      </section>

      {t?.sponsored.map((s) => (
        <Link key={s.vibe + s.ends_at} href={s.spot ? `/spot/${s.spot}/` : `/share/?v=${s.vibe}`}
          className="mt-10 max-w-3xl block rounded-3xl bg-ob text-white p-6">
          <div className="text-xs tracking-[0.2em] uppercase font-semibold text-white/80">Sponsored{s.spot_name ? ` · ${s.spot_name}` : ''}</div>
          <div className="mt-2 font-display font-extrabold text-5xl sm:text-6xl tracking-[-0.04em]">/{s.vibe}</div>
          {s.label && <p className="mt-2 text-lg text-white/90">{s.label}</p>}
        </Link>
      ))}

      <section className="mt-12 max-w-3xl">
        <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">Around Charleston</div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {LOCAL.map((l) => {
            const hit = t?.top.find((x) => x.vibe === l.value)
            return (
              <Link key={l.value} href={`/share/?v=${l.value}`} title={l.place} className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] hover:text-ob">
                /{l.value}{hit && <sup className="ml-1 text-base text-ob tabular-nums">{hit.people || hit.sent}</sup>}
              </Link>
            )
          })}
        </div>
      </section>

      {!t ? <p className="mt-10">Counting&hellip;</p> : t.top.length === 0 ? (
        <section className="mt-12 max-w-xl">
          <p className="text-lg text-[#141414]/70">Nothing trending yet. Start it: make a vibe card and share it.</p>
          <Link href="/share/" className="mt-5 inline-block bg-ob text-white rounded-full px-8 py-4 font-extrabold">Make a vibe card</Link>
        </section>
      ) : (
        <ol className="mt-12 max-w-3xl grid gap-1">
          {t.top.map((v, i) => (
            <li key={v.vibe}>
              <Link href={`/share/?v=${v.vibe}`} className="flex items-baseline gap-4 py-3 border-b border-[#141414]/10">
                <span className="w-8 text-right font-display font-extrabold text-xl text-[#141414]/35 tabular-nums">{i + 1}</span>
                <span className="font-display font-extrabold text-4xl sm:text-5xl tracking-[-0.03em] flex-1 min-w-0 break-all">/{v.vibe}</span>
                <span className="text-sm text-right text-[#141414]/60 shrink-0">
                  {v.people > 0 && <span className="block">{v.people} feeling it</span>}
                  {v.sent > 0 && <span className="block">sent {v.sent}&times;</span>}
                  {v.today > 0 && <span className="block text-ob font-extrabold">&uarr; today</span>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
