'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { rpc } from '@/lib/rest'

type R = { pool: number; founding: number; verified: number; intros: number; dates_set: number; dates_done: number; seconds: number; second_rate: number | null; passes: number; ghosts: number }

export default function ReceiptsPage() {
  const [r, setR] = useState<R | null>(null)
  useEffect(() => { rpc('date_receipts').then(({ data }) => setR(data as R)) }, [])

  const rows: [string, string, string][] = r ? [
    ['People in the pool', String(r.pool), 'Real /names. Demo crew and tests excluded.'],
    ['Founding members', `${r.founding} / 500`, 'Numbered. Season I free.'],
    ['Verified by Val', String(r.verified), 'Photos and voice reviewed by a human.'],
    ['Introductions', String(r.intros), 'Every /chat Val opened.'],
    ['Dates set', String(r.dates_set), 'A /spot and a time, on the record.'],
    ['Went to a /second', r.second_rate === null ? '\u2014' : `${r.second_rate}%`, 'Of dates that happened, how many both people wanted again. The only number that matters.'],
    ['Left kindly (/pass)', String(r.passes), 'Closed with a word from Val, not silence.'],
    ['Ghosted', '0', 'Structurally impossible here. Every /chat ends with a word or a clock.'],
  ] : []

  return (
    <main className="page min-h-dvh bg-white text-[#141414] px-6 sm:px-12 py-10">
      <Link href="/" className="font-display font-extrabold text-2xl tracking-tight">/date</Link>
      <section className="mt-10 max-w-2xl">
        <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob mb-2">/receipts &middot; Charleston &middot; Season I</div>
        <h1 className="font-display font-extrabold text-5xl sm:text-6xl tracking-[-0.03em] leading-[0.95]">The numbers, live.</h1>
        <p className="mt-4 text-lg text-[#141414]/70">Every other app hides these. We publish them. If Val isn&rsquo;t good, you&rsquo;ll see it here first.</p>
        {r && r.dates_done === 0 && (
          <p className="mt-4 text-base bg-[#FFF3EA] rounded-2xl px-5 py-4">Season I hasn&rsquo;t started. Enrollment is open; matching begins on release day. The zeros are honest. &mdash; Val</p>
        )}
        <div className="mt-10 grid gap-0 border-t-2 border-[#141414]">
          {rows.map(([k, v, note]) => (
            <div key={k} className="grid grid-cols-[1fr_auto] gap-4 items-baseline py-5 border-b border-[#141414]/10">
              <div>
                <div className="font-extrabold text-lg">{k}</div>
                <div className="text-sm text-[#141414]/60">{note}</div>
              </div>
              <div className="font-display font-extrabold text-4xl tabular-nums text-ob">{v}</div>
            </div>
          ))}
          {!r && <p className="py-5 text-sm">Counting\u2026</p>}
        </div>
        <Link href="/claim/" className="inline-block mt-10 bg-ob text-white rounded-full px-8 py-4 font-extrabold">Claim your /name</Link>
      </section>
    </main>
  )
}
