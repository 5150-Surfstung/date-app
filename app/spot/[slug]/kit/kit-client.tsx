'use client'

// An approved spot's print kit: a door poster and table cards, each with the
// QR that opens their /spot page. Unapproved or paused spots get nothing.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { useSpot } from '@/lib/venues'
import { BASE } from '../../../pwa'

export default function KitClient({ slug }: { slug: string }) {
  const spot = useSpot(slug)
  const [qr, setQr] = useState<string | null>(null)
  const url = typeof window !== 'undefined' ? `${window.location.origin}${BASE}/spot/${slug}/` : ''

  useEffect(() => {
    if (!spot || !url) return
    QRCode.toDataURL(url, { width: 1200, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#141414', light: '#FFFFFF' } }).then(setQr)
  }, [spot, url])

  if (spot === undefined) return <main className="page min-h-dvh bg-[#FFF3EA]" />
  if (!spot) {
    return (
      <main className="page min-h-dvh flex flex-col bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 py-8">
        <Link href="/" className="self-start font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <div className="my-auto max-w-md">
          <h1 className="font-display font-extrabold text-4xl tracking-[-0.03em]">No kit yet.</h1>
          <p className="mt-4 text-lg text-[#141414]/70">The kit unlocks once a spot is approved. If you&rsquo;ve applied, you&rsquo;ll get an email the moment it is.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="page min-h-dvh bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 pb-16 print:bg-white print:p-0">
      <header className="flex items-center justify-between pt-8 pb-8 print:hidden">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">Spot kit</span>
      </header>

      <section className="max-w-2xl print:hidden">
        <h1 className="font-display font-extrabold text-5xl leading-[0.95] tracking-[-0.035em]">{spot.name}, you&rsquo;re a /date spot.</h1>
        <p className="mt-4 text-lg text-[#141414]/75">Print the poster for the door or the bar, and the table cards for where people sit. Every QR opens your /spot page.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => window.print()} className="bg-ob text-white rounded-full px-8 py-4 font-extrabold">Print the kit</button>
          {qr && <a href={qr} download={`date-spot-${slug}-qr.png`} className="border-2 border-[#141414] rounded-full px-8 py-4 font-extrabold">Download the QR</a>}
          <Link href={`/spot/${slug}/`} className="px-2 py-4 font-semibold underline underline-offset-4">See your page</Link>
        </div>
      </section>

      {/* Poster: one page */}
      <section className="kit-page mt-12 mx-auto bg-white rounded-3xl p-10 sm:p-14 max-w-[640px] text-center print:mt-0 print:rounded-none print:max-w-none">
        <div className="font-display font-extrabold text-3xl tracking-tight">/date</div>
        <div className="mt-8 font-display font-extrabold text-6xl sm:text-7xl leading-[0.92] tracking-[-0.04em]">Single?<br />Scan in.</div>
        <p className="mt-5 text-xl text-[#141414]/75 max-w-sm mx-auto">If someone here is on /date too and it&rsquo;s mutual, Val introduces you. Nobody has to walk over.</p>
        <div className="mt-8 mx-auto w-64 sm:w-72 aspect-square">
          {qr && /* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} alt={`QR code to ${spot.name} on /date`} className="w-full h-full" />}
        </div>
        <div className="mt-6 text-sm font-extrabold uppercase tracking-[0.2em] text-ob">{spot.name} is a /date spot</div>
      </section>

      {/* Table cards: four to a page, cut along the lines */}
      <section className="kit-page mt-12 mx-auto max-w-[640px] grid grid-cols-2 gap-0 bg-white rounded-3xl overflow-hidden print:mt-0 print:rounded-none print:max-w-none">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-6 text-center border border-dashed border-[#141414]/25">
            <div className="font-display font-extrabold text-xl">/date</div>
            <div className="mt-2 font-display font-extrabold text-2xl leading-tight tracking-[-0.03em]">Single? Scan in.</div>
            <div className="mt-3 mx-auto w-32 aspect-square">
              {qr && /* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} alt="" className="w-full h-full" />}
            </div>
            <div className="mt-2 text-[11px] text-[#141414]/60">Val introduces you if it&rsquo;s mutual.</div>
          </div>
        ))}
      </section>
    </main>
  )
}
