'use client'

import Link from 'next/link'
import { useSpot } from '@/lib/venues'
import NightClient from './night-client'

export default function NightLoader({ slug }: { slug: string }) {
  const spot = useSpot(slug)
  if (spot?.night) return <NightClient venue={spot} />
  return (
    <main className="page min-h-dvh flex flex-col bg-[#140A20] text-[#F6EFFF] px-6 sm:px-12 py-8">
      <Link href="/" className="self-start font-display font-extrabold text-3xl tracking-tight">/date</Link>
      <div className="my-auto max-w-md">
        {spot === undefined ? <p className="text-lg">One sec…</p> : <>
          <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em]">No /night here yet.</h1>
          <p className="mt-4 text-lg text-[#F6EFFF]/70">Claim a /name and you&rsquo;ll hear about the first one before anyone else.</p>
          <Link href="/claim/" className="mt-8 inline-block bg-[#FF5CA8] text-[#140A20] rounded-full px-8 py-4 font-extrabold">Claim your /name</Link>
        </>}
      </div>
    </main>
  )
}
