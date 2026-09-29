'use client'

import { useState } from 'react'
import { Missed } from './missed'
import Link from 'next/link'
import type { Venue } from '@/lib/venues'
import { authClient, useSession } from '@/lib/auth'
import { VAL } from '@/lib/val'
import { SignIn } from '../../gate'

type Stage = 'scan' | 'in' | 'noticed'

export default function SpotClient({ venue }: { venue: Venue }) {
  const { email: me, loading: sessionLoading } = useSession()
  const [stage, setStage] = useState<Stage>('scan')
  const [note, setNote] = useState('')
  const [rsvped, setRsvped] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailValid = Boolean(me)

  async function signal(kind: 'checkin' | 'notice' | 'rsvp', text?: string) {
    const supabase = authClient()
    if (!supabase) throw new Error('Not configured yet.')
    const { data, error } = await supabase.rpc('date_signal', { p_kind: kind, p_venue: venue.slug, p_note: text ?? null })
    if (error || data !== 'ok') throw new Error(data === 'limit' ? 'Easy. Try again in a bit.' : 'Something went wrong. Try again.')
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page min-h-dvh flex flex-col bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 pb-12">
      <header className="flex items-center justify-between pt-8 pb-10">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">
          /date
        </Link>
        <span className="text-xs sm:text-sm tracking-[0.2em] uppercase text-ob font-extrabold">
          /spot
        </span>
      </header>

      <section className="max-w-xl flex flex-col gap-8">
        <div>
          <div className="text-xs tracking-[0.2em] uppercase font-extrabold text-ob mb-3">
            This is a /date spot
          </div>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl leading-[0.95] tracking-[-0.03em]">
            {venue.name}
          </h1>
          <p className="mt-3 text-base text-[#141414]/70">{venue.area}</p>
        </div>

        {stage === 'scan' && (
          <>
            <p className="text-xl sm:text-2xl font-medium leading-snug">
              Someone in this room might already be on /date. Scan in, and if
              it&rsquo;s mutual, we introduce you. Nobody has to walk over.
            </p>
            <div className="flex flex-col gap-3 max-w-md">
              {!me && !sessionLoading ? (
                <SignIn cta="Scan me in" pitch="The email on your /vibe. Val sends a link; tap it and you're scanned in." />
              ) : (
              <button
                disabled={!emailValid || busy}
                onClick={() => run(async () => { await signal('checkin'); setStage('in') })}
                className="bg-ob text-white text-base font-extrabold rounded-full px-10 py-4 hover:scale-[1.02] transition-transform disabled:opacity-30"
              >
                {busy ? 'One sec…' : 'Scan in'}
              </button>
              )}
              <p className="text-sm text-[#141414]/50">
                Not on /date yet?{' '}
                <Link href={`/apply?v=${venue.slug}`} className="underline font-semibold text-[#141414]">
                  Get your /vibe
                </Link>{' '}
                — about five minutes.
              </p>
            </div>
          </>
        )}

        {stage === 'in' && (
          <>
            <p className="text-xl sm:text-2xl font-medium leading-snug">
              {VAL.spotIn} <span className="text-[#141414]/70">{VAL.sign}</span>
            </p>
            <div className="flex flex-col gap-3 max-w-md">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Green jacket, by the window, laughing at their own joke."
                className="bg-white border-2 border-[#141414]/12 rounded-xl focus:border-ob outline-none px-4 py-3 text-base placeholder:text-[#141414]/35 resize-none"
              />
              <button
                disabled={!note.trim() || busy}
                onClick={() => run(async () => { await signal('notice', note.trim()); setStage('noticed') })}
                className="bg-ob text-white text-base font-extrabold rounded-full px-10 py-4 hover:scale-[1.02] transition-transform disabled:opacity-30"
              >
                I noticed someone
              </button>
              <button
                onClick={() => setStage('noticed')}
                className="text-sm text-[#141414]/70 underline self-start"
              >
                Nobody tonight — just here
              </button>
            </div>
          </>
        )}

        {stage === 'noticed' && (
          <p className="text-xl sm:text-2xl font-medium leading-snug">
            {VAL.spotNoticed} <span className="text-[#141414]/70">{VAL.sign}</span>
          </p>
        )}

        {error && <p className="text-base font-semibold">{error}</p>}

        <div className="border-2 border-[#141414] rounded-2xl px-6 py-5 max-w-md">
          <div className="text-xs tracking-[0.2em] uppercase font-medium mb-2">The perk</div>
          <p className="text-base text-[#141414]/70 leading-relaxed">{venue.perk}</p>
        </div>

        {venue.night && (
          <div className="border-2 border-[#141414] bg-[#141414]/5 rounded-2xl px-6 py-5 max-w-md">
            <div className="text-xs tracking-[0.2em] uppercase font-medium mb-2">Next /night here</div>
            <div className="font-display font-extrabold text-2xl tracking-tight">{venue.night.when}</div>
            <p className="mt-2 text-base text-[#141414]/70 leading-relaxed">{venue.night.detail}</p>
            {rsvped ? (
              <p className="mt-4 text-base font-semibold">You&rsquo;re on the list.</p>
            ) : (
              <button
                disabled={!emailValid || busy}
                onClick={() => run(async () => { await signal('rsvp'); setRsvped(true) })}
                className="mt-4 bg-ob text-white text-sm font-extrabold rounded-full px-7 py-3 hover:scale-[1.02] transition-transform disabled:opacity-30"
              >
                I&rsquo;m coming
              </button>
            )}
            {!emailValid && (
              <p className="mt-2 text-xs text-[#141414]/50">Sign in above to RSVP.</p>
            )}
          </div>
        )}

        <Missed slug={venue.slug} name={venue.name} refresh={stage === 'scan' ? 0 : 1} />
      </section>
    </main>
  )
}
