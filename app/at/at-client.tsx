'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { EMAIL_KEY, normalizeHandle, tagLine } from '@/lib/handles'
import { VAL, notify } from '@/lib/val'

type Wall = { taken: boolean; open?: boolean; name?: string; tag?: string | null; verified?: boolean }

export default function AtClient({ handle: handleProp }: { handle?: string } = {}) {
  const params = useSearchParams()
  const handle = normalizeHandle(handleProp ?? params.get('h') ?? '')
  const [wall, setWall] = useState<Wall | null>(null)
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [wing, setWing] = useState(false)
  const [friend, setFriend] = useState('')
  const [wingNote, setWingNote] = useState('')
  const [wingResult, setWingResult] = useState<string | null>(null)

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
      notify(getSupabase(), { kind: 'hey', to_handle: handle, from_email: email.trim().toLowerCase() })
      setResult('sent')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function sendWing() {
    setBusy(true); setError(null)
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Not configured yet.')
      const { data, error } = await supabase.rpc('send_wing', { p_from_email: email, p_subject: handle, p_to: friend.trim().replace(/^\//, ''), p_note: wingNote })
      if (error) throw new Error('Something went wrong. Try again.')
      const msgs: Record<string, string> = {
        no_vibe: 'You need a /name to /wing someone.', no_handle: 'That /name doesn\u2019t exist.', closed: 'This /name is private.',
        limit: 'Five /wings a week. You\u2019re out for now.', self: 'That\u2019s one of you.', no_friend: 'No /name by that. Try their email to invite them.',
      }
      if (data !== 'ok' && data !== 'invited') throw new Error(msgs[data] ?? 'Something went wrong.')
      try { localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase()) } catch {}
      notify(getSupabase(), { kind: 'wing', subject: handle })
      setWingResult(data)
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setBusy(false) }
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
              {VAL.privateWall} <span className="text-chalk-2">{VAL.sign}</span>
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
              <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.03em] break-all">
                /{handle}{wall.tag && <span className="block text-3xl sm:text-5xl mt-2 text-chalk-2">/{wall.tag}</span>}
              </h1>
              <p className="mt-3 text-lg text-chalk-2 font-medium">{wall.name}{wall.tag ? ` · ${tagLine(wall.tag)}` : ''}</p>
            </div>

            {result === 'sent' ? (
              <p className="text-xl sm:text-2xl font-medium leading-snug">
                {VAL.heySent(wall.name ?? handle)} <span className="text-chalk-2">{VAL.sign}</span>
              </p>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-medium leading-snug">
                  {handle === VAL.handle
                    ? VAL.valWall
                    : <>Send {wall.name} a /hey. Val shows them your /vibe first. You hear nothing until they say yes.</>}
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

                <div className="border-2 border-white/40 rounded-2xl p-5 max-w-md mt-2">
                  <div className="text-xs tracking-[0.2em] uppercase font-semibold mb-1">Not for you? /wing them.</div>
                  {wingResult ? (
                    <p className="text-base font-medium">{wingResult === 'invited' ? 'Sent. Your friend isn\u2019t on /date yet \u2014 Val will invite them.' : `Sent. Val will show your friend /${handle}. If they\u2019re into it, they send the /hey.`} <span className="text-chalk-2">{VAL.sign}</span></p>
                  ) : !wing ? (
                    <>
                      <p className="text-sm text-chalk-2">Know who {wall.name} is right for? Pass the /name to a friend. They only see this page. Saying yes is theirs.</p>
                      <button onClick={() => setWing(true)} className="mt-3 border-2 border-white rounded-full px-5 py-2.5 text-sm font-extrabold hover:bg-white hover:text-ob transition-colors">I know who</button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input value={friend} onChange={(e) => setFriend(e.target.value)} placeholder="Friend's /name or email"
                        className="bg-ob-1 border-2 border-ob-3 rounded-xl focus:border-gold outline-none px-4 py-3 text-base placeholder:text-chalk-3" />
                      <input value={wingNote} onChange={(e) => setWingNote(e.target.value)} placeholder="Why them (optional)"
                        className="bg-ob-1 border-2 border-ob-3 rounded-xl focus:border-gold outline-none px-4 py-3 text-base placeholder:text-chalk-3" />
                      <button disabled={!emailValid || !friend.trim() || busy} onClick={sendWing}
                        className="bg-white text-ob text-base font-extrabold rounded-full px-8 py-3 hover:scale-[1.02] transition-transform disabled:opacity-30 self-start">Send the /wing</button>
                      {!emailValid && <p className="text-xs text-chalk-3">Enter the email on your /name above first.</p>}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
        {wall && wall.taken && (
          <ReportLink handle={handle} email={email} />
        )}
      </section>
    </main>
  )
}

function ReportLink({ handle, email }: { handle: string; email: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)
  async function send() {
    await getSupabase()?.rpc('report_handle', { p_handle: handle, p_reason: reason || 'report', p_details: null, p_reporter_email: email, p_chat: null })
    setDone(true)
  }
  if (done) return <p className="text-sm text-chalk-3 mt-4">Got it. Val sees it, they don\u2019t. \u2014 Val</p>
  return !open ? (
    <button onClick={() => setOpen(true)} className="text-xs text-chalk-3 underline underline-offset-4 self-start mt-4">Report this /name</button>
  ) : (
    <div className="flex flex-col gap-2 max-w-md mt-4">
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="bg-ob-1 border-2 border-ob-3 rounded-xl px-4 py-3 text-base">
        <option value="">Why?</option>
        <option>Not who they say they are</option>
        <option>Harassing or pressuring</option>
        <option>Under 18</option>
        <option>Something else felt off</option>
      </select>
      <button disabled={!reason || !/.+@.+\..+/.test(email)} onClick={send} className="bg-white text-ob text-sm font-extrabold rounded-full px-6 py-3 self-start disabled:opacity-30">Send to Val</button>
      {!/.+@.+\..+/.test(email) && <p className="text-xs text-chalk-3">Enter your email above so Val can follow up.</p>}
    </div>
  )
}
