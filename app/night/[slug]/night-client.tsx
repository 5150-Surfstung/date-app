'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Venue } from '@/lib/venues'
import { getSupabase } from '@/lib/supabase'
import { authClient, useSession } from '@/lib/auth'
import { VAL } from '@/lib/val'
import { SignIn } from '../../gate'
import { CHECKIN_SAYS, checkIn } from '@/lib/here'

// /night mode: the room as a live pool. Nobody sees who's here — only how
// many. Val makes the intros.
export default function NightClient({ venue }: { venue: Venue }) {
  const [count, setCount] = useState<number | null>(null)
  const { email: me, loading: sessionLoading } = useSession()
  const [stage, setStage] = useState<'door' | 'in' | 'noticed'>('door')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function refresh() {
    const s = getSupabase()
    if (!s) return
    const { data } = await s.rpc('night_count', { p_slug: venue.slug })
    setCount((data as number) ?? 0)
  }
  useEffect(() => {
    refresh(); const t = setInterval(refresh, 15000); return () => clearInterval(t)
  }, [venue.slug])

  // Checking in (by location, or the /date QR at the door) records that you're here; your vibe is yours to set.
  async function scanIn() {
    setBusy(true); setMsg(null)
    const r = await checkIn(venue.slug, { note: 'night' })
    setBusy(false)
    if (r !== 'ok') { setMsg(CHECKIN_SAYS[r]); return }
    setStage('in'); refresh()
  }
  async function noticed() {
    setBusy(true)
    await authClient()?.rpc('date_signal', { p_kind: 'notice', p_venue: venue.slug, p_note: note.trim() })
    setBusy(false); setStage('noticed')
  }

  return (
    <main className="page min-h-dvh bg-[#140A20] text-[#F6EFFF] px-6 sm:px-12 pb-16">
      <header className="flex items-center justify-between pt-8 pb-10">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs sm:text-sm tracking-[0.2em] uppercase font-medium text-[#FF5CA8]">/night</span>
      </header>

      <section className="max-w-xl flex flex-col gap-8">
        <div>
          <div className="text-xs tracking-[0.2em] uppercase font-semibold text-[#FF5CA8] mb-3">Tonight at</div>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl leading-[0.95] tracking-[-0.03em]">{venue.name}</h1>
          {venue.night && <p className="mt-3 text-base text-[#F6EFFF]/70">{venue.night.when} &middot; {venue.night.detail}</p>}
        </div>

        <div className="border-2 border-[#FF5CA8] rounded-3xl p-6">
          <div className="font-display font-extrabold text-7xl tabular-nums text-[#FF5CA8] leading-none">{count ?? '\u2014'}</div>
          <div className="mt-2 text-sm tracking-[0.15em] uppercase text-[#F6EFFF]/60">in the room right now</div>
          <p className="mt-3 text-sm text-[#F6EFFF]/70">Every one verified and single. Nobody sees who. Val does the introductions &mdash; by text, on the floor.</p>
        </div>

        {stage === 'door' && (
          <div className="flex flex-col gap-3 max-w-md">
            <p className="text-xl font-medium leading-snug">Tap in when you walk in. Set your vibe for the night and see who else is feeling it.</p>
            {!me && !sessionLoading ? (
              <SignIn night cta="I'm here" pitch="The email on your /name. Tap Val's link and you're in the room." />
            ) : (
            <button disabled={!me || busy} onClick={scanIn} className="bg-[#FF5CA8] text-[#140A20] text-base font-extrabold rounded-full px-10 py-4 disabled:opacity-30">
              {busy ? 'One sec\u2026' : 'I\u2019m here'}
            </button>
            )}
            {msg && <p className="text-sm font-semibold">{msg}</p>}
            <p className="text-sm text-[#F6EFFF]/60">No /name? <Link href={`/claim/`} className="underline text-[#F6EFFF]">Claim one</Link> &mdash; thirty seconds at the door.</p>
          </div>
        )}

        {stage === 'in' && (
          <div className="flex flex-col gap-3 max-w-md">
            <p className="text-xl font-medium leading-snug">You&rsquo;re in. Someone catch your eye? Tell me. They never hear it unless it&rsquo;s mutual. <span className="text-[#F6EFFF]/60">{VAL.sign}</span></p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Green jacket, by the window."
              className="bg-white/5 border-2 border-white/20 rounded-xl focus:border-[#FF5CA8] outline-none px-4 py-3 text-base placeholder:text-white/40 resize-none" />
            <button disabled={!note.trim() || busy} onClick={noticed} className="bg-[#FF5CA8] text-[#140A20] text-base font-extrabold rounded-full px-10 py-4 self-start disabled:opacity-30">I noticed someone</button>
          </div>
        )}

        {stage === 'noticed' && (
          <p className="text-xl font-medium leading-snug max-w-md">Got it. If it&rsquo;s mutual you&rsquo;ll hear from me tonight. If not, nothing happens and nobody knows. Enjoy the room. <span className="text-[#F6EFFF]/60">{VAL.sign}</span></p>
        )}

        <div className="text-sm text-[#F6EFFF]/50">
          The perk tonight: {venue.perk} &middot; <Link href={`/spot/${venue.slug}`} className="underline">the /spot page</Link>
        </div>
      </section>
    </main>
  )
}
