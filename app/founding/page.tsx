'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { rpc } from '@/lib/rest'

type F = { n: number; handle: string; tag: string | null; tags?: string[] | null }

export default function FoundingPage() {
  const [list, setList] = useState<F[] | null>(null)
  useEffect(() => { rpc('founding_wall').then(({ data }) => setList((data as F[]) ?? [])) }, [])
  const claimed = list?.length ?? 0

  return (
    <main className="page min-h-dvh bg-[#141414] text-white px-6 sm:px-12 py-10">
      <Link href="/" className="font-display font-extrabold text-2xl tracking-tight">/date</Link>
      <section className="mt-10 max-w-5xl">
        <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob mb-2">/founding &middot; Charleston</div>
        <h1 className="font-display font-extrabold text-5xl sm:text-7xl tracking-[-0.03em] leading-[0.95]">The first five hundred.</h1>
        <p className="mt-4 text-lg text-white/70 max-w-xl">Claim a /name during open enrollment and it comes with a number. Season I is free for everyone on this wall. {list ? `${claimed} claimed, ${Math.max(0, 500 - claimed)} left.` : ''}</p>
        <Link href="/claim/" className="inline-block mt-8 bg-ob text-white rounded-full px-8 py-4 font-extrabold">Claim mine</Link>

        <div className="mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3">
          {list?.map((f) => (
            <Link key={f.n} href={`/${f.handle}`} className="flex items-baseline gap-3 border-b border-white/10 py-2 hover:border-ob">
              <span className="font-display font-extrabold text-2xl tabular-nums text-ob w-14">#{String(f.n).padStart(3, '0')}</span>
              <span className="font-display font-extrabold text-xl tracking-tight truncate">/{f.handle}</span>
              {(f.tags?.length ? f.tags : f.tag ? [f.tag] : []).length > 0 && <span className="text-xs text-white/50 truncate">{(f.tags?.length ? f.tags : [f.tag]).map((t) => `/${t}`).join(' ')}</span>}
            </Link>
          ))}
          {list && list.length === 0 && <p className="text-sm text-white/60 col-span-full">Nobody yet. #001 is open.</p>}
        </div>
        <p className="mt-10 text-xs text-white/40">Private /names are numbered but not listed. Demo crew holds the first numbers until enrollment opens; they give them back.</p>
      </section>
    </main>
  )
}
