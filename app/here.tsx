'use client'

// The "you're here" card. If a member already lets /date see their location,
// opening the app at a /date spot offers a one-tap check-in. Otherwise it's a
// single "I'm out at a /date spot" button that asks only when tapped.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth'
import { CHECKIN_SAYS, checkIn, checkOut, getFix, locationAllowed, spotsNear, type Fix, type Near } from '@/lib/here'

type Now = { slug: string; name: string } | null
const SKIP = 'date-here-skip'
const today = () => new Date().toDateString()
const skipped = (slug: string) => { try { return localStorage.getItem(SKIP) === `${today()}|${slug}` } catch { return false } }
const skip = (slug: string) => { try { localStorage.setItem(SKIP, `${today()}|${slug}`) } catch {} }

export function HereCard({ ask = true }: { ask?: boolean }) {
  const [now, setNow] = useState<Now | undefined>(undefined)
  const [near, setNear] = useState<Near[]>([])
  const [fix, setFix] = useState<Fix | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadNow = () => authClient()!.rpc('my_spot_now').then(({ data }) => setNow((data as Now) ?? null))
  useEffect(() => {
    loadNow().then(async () => {
      if (!(await locationAllowed())) return
      const f = await getFix(8000)
      if (!f) return
      const r = await spotsNear(f)
      setFix(f); setNear(r.spots.filter((s) => !skipped(s.slug)))
    })
  }, [])

  async function look() {
    setBusy(true); setMsg(null)
    const f = await getFix()
    if (!f) { setBusy(false); setMsg(CHECKIN_SAYS.no_location); return }
    const r = await spotsNear(f)
    setBusy(false); setFix(f); setNear(r.spots)
    if (r.state === 'fuzzy') setMsg(CHECKIN_SAYS.fuzzy)
    else if (!r.spots.length) setMsg('No /date spot right here. At one? Scan the /date QR on the window.')
  }
  async function go(slug: string) {
    setBusy(true); setMsg(null)
    const r = await checkIn(slug, { fix })
    setBusy(false)
    if (r === 'ok') { setNear([]); loadNow() } else setMsg(CHECKIN_SAYS[r])
  }
  async function out() {
    if (!now) return
    setBusy(true); await checkOut(now.slug); setBusy(false); setNow(null)
  }

  if (now === undefined) return null
  if (now) return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-ob text-white px-4 py-3">
      <span className="live-dot" aria-hidden />
      <Link href={`/spot/${now.slug}/`} className="font-extrabold">You&rsquo;re at {now.name}</Link>
      <button onClick={out} disabled={busy} className="ml-auto text-sm font-semibold underline underline-offset-4">I&rsquo;m out</button>
    </div>
  )
  if (near.length) return (
    <div className="mb-6 rounded-2xl bg-[#141414] text-white p-4 grid gap-3 rise">
      <div className="font-display font-extrabold text-xl leading-tight">
        {near.length === 1 ? <>You&rsquo;re at {near[0].name}. Be seen here tonight?</> : 'Which /date spot are you at?'}
      </div>
      <div className="flex flex-wrap gap-2">
        {near.map((s) => (
          <button key={s.slug} onClick={() => go(s.slug)} disabled={busy}
            className="bg-ob rounded-full px-5 py-2.5 text-sm font-extrabold disabled:opacity-50">
            {near.length === 1 ? 'I’m here' : s.name}
          </button>
        ))}
        <button onClick={() => { near.forEach((s) => skip(s.slug)); setNear([]) }} className="px-3 py-2.5 text-sm text-white/60">Not now</button>
      </div>
      {msg && <p className="text-sm text-white/80">{msg}</p>}
    </div>
  )
  if (!ask) return null
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1">
      <button onClick={look} disabled={busy} className="rounded-full border-2 border-[#141414]/15 px-4 py-2 text-sm font-extrabold hover:border-ob disabled:opacity-50">
        {busy ? 'Looking…' : 'Out at a /date spot? I’m here'}
      </button>
      {msg && <p className="text-sm text-[#141414]/60">{msg}</p>}
    </div>
  )
}
