'use client'

// Val's couples. Real ones only: both people said yes to being here, and either
// can take their story down anytime. The count includes couples who kept it private.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { rpc } from '@/lib/rest'

type Wall = { count: number; stories: { a: string; b: string; spot: string | null; when: string; reason: string | null }[] }

export default function CouplesPage() {
  const [w, setW] = useState<Wall | null>(null)
  useEffect(() => { rpc<Wall>('couples_wall').then(({ data }) => setW(data ?? { count: 0, stories: [] })) }, [])
  return (
    <main className="page min-h-dvh bg-ob text-white px-6 sm:px-12 pb-16">
      <header className="flex items-center justify-between pt-8 pb-10">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs tracking-[0.2em] uppercase font-semibold text-white/80">Val&rsquo;s couples</span>
      </header>

      <section className="max-w-3xl">
        <div className="font-display font-extrabold text-[clamp(5rem,22vw,11rem)] leading-none tabular-nums">{w ? w.count : '—'}</div>
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl leading-[0.95] tracking-[-0.04em]">{w?.count === 1 ? 'couple' : 'couples'} and counting.</h1>
        <p className="mt-4 text-lg text-white/85 max-w-xl">Real people who found each other on /date. The ones below chose to share their story; both of them said yes.</p>
      </section>

      {w && w.stories.length > 0 ? (
        <section className="mt-12 grid sm:grid-cols-2 gap-3 max-w-4xl">
          {w.stories.map((s, i) => (
            <div key={i} className="rounded-3xl bg-white text-[#141414] p-6">
              <div className="font-display font-extrabold text-3xl tracking-[-0.03em] leading-tight">/{s.a} <span className="text-ob">+</span> /{s.b}</div>
              <div className="mt-2 text-sm text-[#141414]/60">{s.spot ? `First date at ${s.spot}` : 'Val introduced them'} &middot; {s.when}</div>
              {s.reason && <p className="mt-3 text-base"><span className="font-extrabold text-ob">Val:</span> {s.reason}</p>}
            </div>
          ))}
        </section>
      ) : w && (
        <p className="mt-12 text-lg text-white/85 max-w-xl">The first stories land here soon. We&rsquo;ll never make one up.</p>
      )}

      <Link href="/claim/" className="mt-12 inline-block bg-white text-ob rounded-full px-10 py-5 text-lg font-extrabold">Your turn. Claim your /name</Link>
    </main>
  )
}
