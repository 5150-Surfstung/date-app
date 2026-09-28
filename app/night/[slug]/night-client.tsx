'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Venue } from '@/lib/venues'
import { getSupabase, SIGNALS_TABLE } from '@/lib/supabase'
import { EMAIL_KEY, HANDLE_KEY } from '@/lib/handles'
import { VAL } from '@/lib/val'

// /night mode: the room as a live pool. Nobody sees who's here — only how
// many. Val makes the intros.
export default function NightClient({ venue }: { venue: Venue }) {
  const [count, setCount] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState<string | null>(null)
  const [stage, setStage] = useState<'door' | 'in' | 'noticed'>('door')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    const { data } = await getSupabase()!.rpc('night_count', { p_slug: venue.slug })
    setCount((data as number) ?? 0)
  }
  useEffect(() => {
    try { setEmail(localStorage.getItem(EMAIL_KEY) ?? ''); setHandle(localStorage.getItem(HANDLE_KEY)) } catch {}
    refresh(); const t = setInterval(refresh, 15000); return () => clearInterval(t)
  }, [venue.slug])

  const emailValid = /.+@.+\..+/.test(email)

  async function scanIn() {
    setBusy(true)
    const s = getSupabase()!
    await s.from(SIGNALS_TABLE).insert({ kind: 'checkin', venue_slug: venue.slug, email: email.trim().toLowerCase(), note: 'night' })
    // Tonight-only for the night: your /name goes dark at midnight unless you change it back.
    if (handle) await s.rpc('set_tag', { p_handle: handle, p_email: email.trim().toLowerCase(), p_tag: 'tonight', p_private: false })
    try { localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase()) } catch {}
    setBusy(false); setStage('in'); refresh()
  }
  async function noticed() {
    setBusy(true)
    await getSupabase()!.from(SIGNALS_TABLE).insert({ kind: 'notice', venue_slug: venue.slug, email: email.trim().toLowerCase(), note: note.trim() })
    setBusy(false); setStage('noticed')
  }

  return (
    <main className="min-h-screen bg-[#140A20] text-[#F6EFFF] px-6 sm:px-12 pb-16">
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
            <p className="text-xl font-medium leading-snug">Scan in at the door. Your /name goes /tonight &mdash; give it out freely, it&rsquo;s gone at midnight.</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="The email on your /name"
              className="bg-white/5 border-2 border-white/20 rounded-xl focus:border-[#FF5CA8] outline-none px-4 py-3 text-base placeholder:text-white/40" />
            <button disabled={!emailValid || busy} onClick={scanIn} className="bg-[#FF5CA8] text-[#140A20] text-base font-extrabold rounded-full px-10 py-4 disabled:opacity-30">
              {busy ? 'One sec\u2026' : 'I\u2019m here'}
            </button>
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
