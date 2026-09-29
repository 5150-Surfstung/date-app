'use client'

import Link from 'next/link'
import { useSpot } from '@/lib/venues'
import SpotClient from './spot-client'

export default function SpotLoader({ slug }: { slug: string }) {
  const spot = useSpot(slug)
  if (spot) return <SpotClient venue={spot} />
  return (
    <main className="page min-h-dvh flex flex-col bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 py-8">
      <Link href="/" className="self-start font-display font-extrabold text-3xl tracking-tight">/date</Link>
      <div className="my-auto max-w-md">
        {spot === undefined ? <p className="text-lg">One sec…</p> : <>
          <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em]">Not a /date spot. Yet.</h1>
          <p className="mt-4 text-lg text-[#141414]/70">This place isn&rsquo;t live on /date, or it&rsquo;s taking a break.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/claim/" className="bg-ob text-white rounded-full px-8 py-4 text-center font-extrabold">Claim your /name</Link>
            <Link href="/partner/" className="border-2 border-[#141414] rounded-full px-8 py-4 text-center font-extrabold">Run this place? Apply</Link>
          </div>
        </>}
      </div>
    </main>
  )
}
