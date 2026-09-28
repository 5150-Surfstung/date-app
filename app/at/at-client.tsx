'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { EMAIL_KEY, normalizeHandle } from '@/lib/handles'

type Wall = { taken: boolean; open?: boolean; name?: string }

export default function AtClient() {
  const params = useSearchParams()
  const handle = normalizeHandle(params.get('h') ?? '')
  const [wall, setWall] = useState<Wall | null>(null)
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const e = localStorage.getItem(EMAIL_KEY)
      if (e) setEmail(e)
    } catch {}
  }, [])

  useEffect(() => {
    if (!handle) { setWall({ taken: false }); return }
    const supabase = getSupabase()
    if (!supabase) return
    supabase.rpc('handle_wall', { p_handle: handle }).then(({ data }) => setWall(data ?? { taken: false }))
  }, [handle])

  const emailValid = /.+@.+\..+/.test(email)

  async function sendHey() {
    setBusy(true)
    setError(null)
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Not configured yet.')
      const { data, error } = await supabase.rpc('send_hey', {
        p_to: handle, p_from_email: email, p_note: note,
      })
      if (error) throw new Error('Something went wrong. Try again.')
      const msgs: Record<string, string> = {
        no_vibe: 'You need a /name to send a /hey.',
        closed: `/${handle} isn’t taking /heys right now.`,
        self: 'That’s you.',
        dupe: `You already sent /${handle} a /hey. One is the rule.`,
        no_handle: 'That /name doesn’t exist.',
      }
      if (data !== 'ok') throw new Error(msgs[data] ?? 'Something went wrong.')
      try { localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase()) } catch {}
      setResult('sent')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col px-6 sm:px-12 pb-12">
      <header className="flex items-center justify-between pt-8 pb-10">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs sm:text-sm tracking-[0.2em] uppercase text-chalk-2 font-medium">/hey</span>
      </header>

      <section className="max-w-xl flex flex-col gap-8">
        {wall === null && <p className="text-xl font-medium">Looking up /{handle}…</p>}

        {wall && !wall.taken && (
          <>
            <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.03em] break-all">
              /{handle || 'nobody'}
            </h1>
            <p className="text-xl sm:text-2xl font-medium leading-snug">
              Nobody has this /name{handle ? ' yet' : ''}.
            </p>
            {handle && (
              <Link href="/claim" className="bg-white text-ob text-base font-extrabold rounded-full px-9 py-4 self-start hover:scale-[1.02] transition-transform">
                Claim /{handle}
              </Link>
            )}
          </>
        )}

        {wall && wall.taken && !wall.open && (
          <>
            <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.03em] break-all">/{handle}</h1>
            <p className="text-xl sm:text-2xl font-medium leading-snug">
              This /name is private. Introductions come through the matchmaker only.
            </p>
            <Link href="/apply" className="border-2 border-white text-base font-extrabold rounded-full px-9 py-4 self-start hover:bg-gold-faint transition-colors">
              Get your /vibe
            </Link>
          </>
        )}

        {wall && wall.taken && wall.open && (
          <>
            <div>
              <div className="text-xs tracking-[0.2em] uppercase font-medium mb-3">On /date</div>
              <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.03em] break-all">/{handle}</h1>
              <p className="mt-3 text-lg text-chalk-2 font-medium">{wall.name}</p>
            </div>

            {result === 'sent' ? (
              <p className="text-xl sm:text-2xl font-medium leading-snug">
                Sent. {wall.name} gets a /preview of your /vibe and decides. If it&rsquo;s a yes,
                you&rsquo;ll hear from us. If not, nothing happens and nobody knows.
              </p>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-medium leading-snug">
                  Send {wall.name} a /hey. They see your /vibe first. You see nothing
                  until they say yes.
                </p>
                <div className="flex flex-col gap-3 max-w-md">
                  <label className="grid gap-1.5">
                    <span className="text-xs tracking-[0.18em] uppercase text-chalk-2">The email on your /name</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="bg-ob-1 border-2 border-ob-3 rounded-xl focus:border-gold outline-none px-4 py-3 text-base" />
                  </label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                    placeholder="Optional. One line. Where you met, what you noticed."
                    className="bg-ob-1 border-2 border-ob-3 rounded-xl focus:border-gold outline-none px-4 py-3 text-base placeholder:text-chalk-3 resize-none" />
                  <button disabled={!emailValid || busy} onClick={sendHey}
                    className="bg-white text-ob text-base font-extrabold rounded-full px-10 py-4 hover:scale-[1.02] transition-transform disabled:opacity-30">
                    {busy ? 'Sending…' : 'Send a /hey'}
                  </button>
                  {error && <p className="text-base font-semibold">{error}</p>}
                  <p className="text-sm text-chalk-3">
                    No /name yet?{' '}
                    <Link href="/claim" className="underline font-semibold text-chalk">Claim yours</Link> &mdash; thirty seconds.
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </main>
  )
}
