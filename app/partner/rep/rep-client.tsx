'use client'

// A sales rep's page, made to hold up on a phone in front of a venue owner:
// a big QR they can scan, or a link to text or email. Both carry the rep's code,
// so the application is credited to them. Every spot still comes to Val first.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { rpc } from '@/lib/rest'
import { BASE } from '../../pwa'

const POINTS = [
  'Singles on /date scan in when they arrive. If it’s mutual, Val introduces them. Nobody has to walk over.',
  'Val can suggest their place for first dates she sets up.',
  'Optional: a monthly /night, a room full of verified singles.',
  'Nothing to install. Staff don’t have to do anything.',
  'Every spot is reviewed by a person before it goes live.',
]

export default function RepClient() {
  const [code, setCode] = useState<string | null>(null)
  const [rep, setRep] = useState<string | null | undefined>(undefined)
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c')?.toLowerCase() ?? null
    setCode(c)
    if (!c) { setRep(null); return }
    rpc<string | null>('public_rep', { p_code: c }).then(({ data }) => setRep(data ?? null))
  }, [])

  const link = code && typeof window !== 'undefined' ? `${window.location.origin}${BASE}/partner/?rep=${code}` : ''

  useEffect(() => {
    if (!link || !rep) return
    QRCode.toDataURL(link, { width: 720, margin: 1, color: { dark: '#141414', light: '#FFFFFF' } }).then(setQr)
  }, [link, rep])

  const message = `Hi — this is ${rep ?? ''} from /date. Here's the page about making your place a /date spot: ${link}`

  async function share() {
    if (navigator.share) { try { await navigator.share({ title: 'Make your place a /date spot', text: message, url: link }) } catch {} ; return }
    copy()
  }
  function copy() {
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) })
  }

  if (rep === undefined) return <main className="page min-h-dvh bg-[#FFF3EA]" />
  if (!rep) {
    return (
      <main className="page min-h-dvh flex flex-col bg-[#FFF3EA] text-[#141414] px-6 py-8">
        <Link href="/" className="self-start font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <div className="my-auto max-w-md">
          <h1 className="font-display font-extrabold text-4xl tracking-[-0.03em]">This rep link isn&rsquo;t active.</h1>
          <p className="mt-4 text-lg text-[#141414]/70">Ask Val&rsquo;s team for your link. Venues can still apply directly.</p>
          <Link href="/partner/" className="mt-8 inline-block bg-ob text-white rounded-full px-8 py-4 font-extrabold">The venue page</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page min-h-dvh bg-[#141414] text-white px-6 pb-12">
      <header className="flex items-center justify-between pt-8 pb-8">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs tracking-[0.2em] uppercase font-semibold text-white/60">{rep}</span>
      </header>

      <section className="max-w-md mx-auto text-center">
        <h1 className="font-display font-extrabold text-4xl leading-[0.95] tracking-[-0.035em]">Make your place a /date spot.</h1>
        <p className="mt-3 text-base text-white/70">Scan with your camera to see how it works and apply.</p>
        <div className="mt-6 mx-auto w-full max-w-[340px] aspect-square rounded-3xl bg-white p-4">
          {qr && /* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} alt="QR code to the /date venue page" className="w-full h-full" />}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={share} className="col-span-2 bg-ob text-white rounded-full px-6 py-4 font-extrabold">Send them the link</button>
          <a href={`sms:?&body=${encodeURIComponent(message)}`} className="border-2 border-white rounded-full px-4 py-3 font-extrabold text-center">Text it</a>
          <a href={`mailto:?subject=${encodeURIComponent('Make your place a /date spot')}&body=${encodeURIComponent(message)}`} className="border-2 border-white rounded-full px-4 py-3 font-extrabold text-center">Email it</a>
          <button onClick={copy} className="col-span-2 text-sm font-semibold underline underline-offset-4 text-white/70">{copied ? 'Copied' : 'Copy link'}</button>
        </div>
      </section>

      <section className="max-w-md mx-auto mt-12 rounded-3xl bg-white/[0.06] p-6">
        <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">Your pitch in twenty seconds</div>
        <ul className="mt-4 grid gap-3 text-base text-white/85">
          {POINTS.map((p) => <li key={p} className="flex gap-3"><span className="text-ob font-extrabold">/</span>{p}</li>)}
        </ul>
        <p className="mt-5 text-sm text-white/55">Don&rsquo;t promise approval. Every spot is reviewed by a person, and they&rsquo;ll hear back within about two days.</p>
      </section>
    </main>
  )
}
