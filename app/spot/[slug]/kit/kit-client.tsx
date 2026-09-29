'use client'

// An approved spot's window QR. The QR carries the spot's door key, so scanning
// it checks a member in even with location off. The link to this page comes in
// the approval email and from Val's console; without the key, there's nothing here.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { rpc } from '@/lib/rest'
import { doorKey } from '@/lib/here'
import { BASE } from '../../../pwa'

type Door = { slug: string; name: string; key: string }

export default function KitClient({ slug }: { slug: string }) {
  const [door, setDoor] = useState<Door | null | undefined>(undefined)
  const [png, setPng] = useState<string | null>(null)
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    const k = doorKey()
    if (!k) { setDoor(null); return }
    rpc<Door | null>('spot_door', { p_slug: slug, p_key: k }).then(({ data }) => setDoor(data ?? null))
  }, [slug])

  useEffect(() => {
    if (!door) return
    const url = `${window.location.origin}${BASE}/spot/${door.slug}/?k=${door.key}`
    const opts = { margin: 1, errorCorrectionLevel: 'M' as const, color: { dark: '#141414', light: '#FFFFFF' } }
    QRCode.toDataURL(url, { ...opts, width: 1600 }).then(setPng)
    QRCode.toString(url, { ...opts, type: 'svg' }).then((s) => setSvg(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`))
  }, [door])

  if (door === undefined) return <main className="page min-h-dvh bg-[#FFF3EA]" />
  if (!door) {
    return (
      <main className="page min-h-dvh flex flex-col bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 py-8">
        <Link href="/" className="self-start font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <div className="my-auto max-w-md">
          <h1 className="font-display font-extrabold text-4xl tracking-[-0.03em]">Use the link from your email.</h1>
          <p className="mt-4 text-lg text-[#141414]/70">Your window QR is in the email you got when your spot was approved. Can&rsquo;t find it? Just reply to any email from Val.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="page min-h-dvh bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 pb-16 print:bg-white print:p-0">
      <header className="flex items-center justify-between pt-8 pb-8 print:hidden">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">Window QR</span>
      </header>

      <section className="max-w-2xl print:hidden">
        <h1 className="font-display font-extrabold text-5xl leading-[0.95] tracking-[-0.035em]">{door.name}, you&rsquo;re a /date spot.</h1>
        <p className="mt-4 text-lg text-[#141414]/75">One thing goes up: this QR, on the window or the door. Members check in from the app when they walk in. The QR is for everyone else, and it works even with location off. Nobody on staff has to say a word.</p>
        <p className="mt-3 text-base text-[#141414]/60">Having a sticker designed? Send your designer the SVG. Keep the QR dark on light, at least 1.5 inches wide.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => window.print()} className="bg-ob text-white rounded-full px-8 py-4 font-extrabold">Print it</button>
          {png && <a href={png} download={`date-${door.slug}-window-qr.png`} className="border-2 border-[#141414] rounded-full px-6 py-4 font-extrabold">PNG</a>}
          {svg && <a href={svg} download={`date-${door.slug}-window-qr.svg`} className="border-2 border-[#141414] rounded-full px-6 py-4 font-extrabold">SVG</a>}
          <Link href={`/spot/${door.slug}/`} className="px-2 py-4 font-semibold underline underline-offset-4">See your page</Link>
        </div>
      </section>

      {/* The window sticker: one page */}
      <section className="kit-page [print-color-adjust:exact] [-webkit-print-color-adjust:exact] mt-12 mx-auto bg-ob text-white rounded-[2.5rem] p-10 sm:p-14 max-w-[560px] text-center print:mt-0 print:max-w-none">
        <div className="font-display font-extrabold text-4xl tracking-tight">/date</div>
        <div className="mt-6 font-display font-extrabold text-6xl sm:text-7xl leading-[0.9] tracking-[-0.045em]">Single?<br />You&rsquo;re in<br />the right place.</div>
        <div className="mt-8 mx-auto w-60 sm:w-64 aspect-square bg-white rounded-3xl p-4">
          {png && /* eslint-disable-next-line @next/next/no-img-element */ <img src={png} alt={`QR code for ${door.name} on /date`} className="w-full h-full" />}
        </div>
        <p className="mt-6 text-lg font-semibold text-white/90 max-w-xs mx-auto">If someone here is on /date too and it&rsquo;s mutual, Val introduces you.</p>
        <div className="mt-5 text-xs font-extrabold uppercase tracking-[0.25em]">{door.name} &middot; a /date spot</div>
      </section>
    </main>
  )
}
