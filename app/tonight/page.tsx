'use client'

// Who's out tonight. Counts only, never names, and nothing shows until at
// least three people are there, so nobody can be picked out of a crowd.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { rpc } from '@/lib/rest'
import { tonightLine } from '@/lib/valsays'

type Map = {
  spots: { slug: string; name: string; area: string | null; total: number; vibes: { vibe: string; n: number }[] }[]
  town: { vibe: string; n: number }[]
  live_spots: number
}

export default function TonightPage() {
  const [map, setMap] = useState<Map | null>(null)
  useEffect(() => {
    const load = () => rpc<Map>('vibe_map').then(({ data }) => setMap(data ?? { spots: [], town: [], live_spots: 0 }))
    load()
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [])

  return (
    <main className="page min-h-dvh bg-[#140A20] text-[#F6EFFF] px-6 sm:px-12 pb-16">
      <header className="flex items-center justify-between pt-8 pb-10">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-semibold text-[#FF5CA8]">
          <span className="w-2 h-2 rounded-full bg-[#FF5CA8] live-dot" /> Live
        </span>
      </header>

      <section className="max-w-3xl">
        <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.04em]">Who&rsquo;s out tonight.</h1>
        <p className="mt-4 text-lg text-[#F6EFFF]/70 max-w-xl">Verified /date members, right now, by vibe. Never names. A crowd shows up here once three or more are there.</p>
      </section>

      {!map ? <p className="mt-10 text-lg">Looking around&hellip;</p> : (
        <>
          {tonightLine(map.spots, map.town) && (
            <p className="mt-10 max-w-2xl rounded-3xl border-2 border-[#FF5CA8] px-6 py-5 text-xl sm:text-2xl font-semibold leading-snug rise">
              {tonightLine(map.spots, map.town)} <span className="text-[#FF5CA8]">&mdash; Val</span>
            </p>
          )}
          {map.town.length > 0 && (
            <section className="mt-12">
              <div className="text-xs tracking-[0.2em] uppercase font-semibold text-[#FF5CA8]">Charleston is feeling</div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {map.town.map((t) => (
                  <Link key={t.vibe} href={`/share/?v=${t.vibe}`} className="font-display font-extrabold text-4xl sm:text-6xl tracking-[-0.03em]">
                    /{t.vibe}<sup className="ml-1 text-lg text-[#FF5CA8] tabular-nums">{t.n}</sup>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-12 grid gap-3 max-w-3xl">
            {map.spots.map((s) => (
              <Link key={s.slug} href={`/spot/${s.slug}/`} className="rounded-3xl bg-white/[0.06] hover:bg-white/[0.1] p-5 sm:p-6 grid gap-3">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <div className="font-display font-extrabold text-3xl tracking-tight">{s.name}</div>
                    {s.area && <div className="text-sm text-[#F6EFFF]/60">{s.area}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-display font-extrabold text-5xl tabular-nums text-[#FF5CA8] leading-none">{s.total}</div>
                    <div className="text-xs uppercase tracking-[0.15em] text-[#F6EFFF]/60 mt-1">here now</div>
                  </div>
                </div>
                {s.vibes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {s.vibes.map((v) => <span key={v.vibe} className="rounded-full bg-[#FF5CA8] text-[#140A20] px-3 py-1 text-sm font-extrabold">{v.n} feeling /{v.vibe}</span>)}
                  </div>
                )}
              </Link>
            ))}
          </section>

          {map.spots.length === 0 && (
            <section className="mt-12 max-w-xl rounded-3xl bg-white/[0.06] p-6">
              {map.live_spots === 0 ? (
                <>
                  <div className="font-display font-extrabold text-3xl tracking-tight">The first /spots open soon.</div>
                  <p className="mt-2 text-[#F6EFFF]/70">Bars, caf&eacute;s and studios around Charleston, each one approved by a person. Claim your /name and you&rsquo;ll know the night they go live.</p>
                </>
              ) : (
                <>
                  <div className="font-display font-extrabold text-3xl tracking-tight">Quiet so far.</div>
                  <p className="mt-2 text-[#F6EFFF]/70">Be the reason it isn&rsquo;t. Walk into a /spot, tap &ldquo;I&rsquo;m here&rdquo;, and set your vibe for the night.</p>
                </>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/claim/" className="bg-[#FF5CA8] text-[#140A20] rounded-full px-6 py-3 font-extrabold">Claim your /name</Link>
                <Link href="/partner/" className="border-2 border-[#F6EFFF] rounded-full px-6 py-3 font-extrabold">Run a spot?</Link>
              </div>
            </section>
          )}
        </>
      )}
      <Link href="/guide/" className="mt-12 inline-block font-semibold underline underline-offset-4 text-[#F6EFFF]/80">Val&rsquo;s Charleston: where first dates turn into seconds &rarr;</Link>
    </main>
  )
}
