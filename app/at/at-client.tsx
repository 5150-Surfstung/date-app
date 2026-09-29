'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { authClient, useSession } from '@/lib/auth'
import { normalizeHandle, tagLine } from '@/lib/handles'
import { VAL, notify } from '@/lib/val'
import { SignIn } from '../gate'
import { TagLine } from '../tags'

type Wall = { taken: boolean; open?: boolean; name?: string; tag?: string | null; tags?: string[] | null; verified?: boolean; demo?: boolean }

export default function AtClient({ handle: handleProp }: { handle?: string } = {}) {
  const params = useSearchParams()
  const handle = normalizeHandle(handleProp ?? params.get('h') ?? '')
  const [wall, setWall] = useState<Wall | null>(null)
  const { email: me, loading: sessionLoading } = useSession()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [wing, setWing] = useState(false)
  const [friend, setFriend] = useState('')
  const [wingNote, setWingNote] = useState('')
  const [wingResult, setWingResult] = useState<string | null>(null)

  const [slow, setSlow] = useState(false)
  const [tries, setTries] = useState(0)
  useEffect(() => {
    if (!handle) { setWall({ taken: false }); return }
    const supabase = getSupabase()
    if (!supabase) return
    setSlow(false)
    const t = setTimeout(() => setSlow(true), 8000)
    supabase.rpc('handle_wall', { p_handle: handle }).then(({ data, error }) => {
      clearTimeout(t)
      if (error) { setSlow(true); return }
      setWall(data ?? { taken: false })
    })
    return () => clearTimeout(t)
  }, [handle, tries])

  const signedIn = Boolean(me)

  async function sendHey() {
    setBusy(true)
    setError(null)
    try {
      const supabase = authClient()
      if (!supabase) throw new Error('Not configured yet.')
      const { data, error } = await supabase.rpc('send_hey', { p_to: handle, p_note: note })
      if (error) throw new Error('Something went wrong. Try again.')
      const msgs: Record<string, string> = {
        no_vibe: 'You need a /name to send a /hey.',
        login: 'Sign in first.',
        limit: 'Ten /heys a day. Val likes you choosy.',
        demo: `/${handle} is a demo profile, not a real person.`,
        closed: `/${handle} isn’t taking /heys right now.`,
        self: 'That’s you.',
        dupe: `You already sent /${handle} a /hey. One is the rule.`,
        no_handle: 'That /name doesn’t exist.',
      }
      if (data !== 'ok') throw new Error(msgs[data] ?? 'Something went wrong.')
      notify(authClient(), { kind: 'hey', to_handle: handle, from_email: me })
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
      const supabase = authClient()
      if (!supabase) throw new Error('Not configured yet.')
      const { data, error } = await supabase.rpc('send_wing', { p_subject: handle, p_to: friend.trim().replace(/^\//, ''), p_note: wingNote })
      if (error) throw new Error('Something went wrong. Try again.')
      const msgs: Record<string, string> = {
        no_vibe: 'You need a /name to /wing someone.', no_handle: 'That /name doesn\u2019t exist.', closed: 'This /name is private.',
        limit: 'Five /wings a week. You\u2019re out for now.', self: 'That\u2019s one of you.', no_friend: 'No /name by that. Try their email to invite them.',
      }
      if (data !== 'ok' && data !== 'invited') throw new Error(msgs[data] ?? 'Something went wrong.')
      notify(authClient(), { kind: 'wing', subject: handle })
      setWingResult(data)
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setBusy(false) }
  }

  return (
    <main className="page min-h-dvh flex flex-col bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 pb-12">
      <header className="flex items-center justify-between pt-8 pb-10">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs sm:text-sm tracking-[0.2em] uppercase text-ob font-extrabold">/hey</span>
      </header>

      <section className="max-w-xl flex flex-col gap-8">
        {wall === null && !slow && <p className="text-xl font-medium">Looking up /{handle}…</p>}
        {wall === null && slow && (
          <div>
            <p className="text-xl font-medium">Can&rsquo;t reach Val right now.</p>
            <p className="mt-2 text-[#141414]/50">Check your signal and try again.</p>
            <button onClick={() => { setSlow(false); setTries((n) => n + 1) }} className="mt-5 bg-ob text-white rounded-full px-7 py-3.5 font-extrabold">Try again</button>
          </div>
        )}

        {wall && !wall.taken && (
          <>
            <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.03em] break-all">
              /{handle || 'nobody'}
            </h1>
            <p className="text-xl sm:text-2xl font-medium leading-snug">
              Nobody has this /name{handle ? ' yet' : ''}.
            </p>
            {handle && (
              <Link href="/claim" className="bg-ob text-white text-base font-extrabold rounded-full px-9 py-4 self-start hover:scale-[1.02] transition-transform">
                Claim /{handle}
              </Link>
            )}
          </>
        )}

        {wall && wall.taken && !wall.open && (
          <>
            <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.03em] break-all">/{handle}</h1>
            <p className="text-xl sm:text-2xl font-medium leading-snug">
              {VAL.privateWall} <span className="text-[#141414]/70">{VAL.sign}</span>
            </p>
            <Link href="/apply" className="border-2 border-[#141414] text-base font-extrabold rounded-full px-9 py-4 self-start hover:bg-[#141414]/5 transition-colors">
              Get your /vibe
            </Link>
          </>
        )}

        {wall && wall.taken && wall.open && (
          <>
            <div>
              <div className="text-xs tracking-[0.2em] uppercase font-extrabold text-ob mb-3">On /date</div>
              <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.03em] break-all">
                /{handle}{wall.tag && <span className="block text-3xl sm:text-5xl mt-2"><TagLine tags={wall.tags} tag={wall.tag} /></span>}
              </h1>
              <p className="mt-3 text-lg text-[#141414]/70 font-medium">{wall.name}{wall.tag ? ` · ${tagLine(wall.tag)}` : ''}</p>
            </div>

            {wall.demo ? (
              <div className="rounded-2xl bg-white border-2 border-[#141414]/10 p-5 max-w-md">
                <div className="text-xs tracking-[0.2em] uppercase font-extrabold text-ob">Demo profile</div>
                <p className="mt-2 text-lg font-medium leading-snug">{wall.name} isn&rsquo;t a real person, so there&rsquo;s nobody to send a /hey to. The real ones are joining now.</p>
                <Link href="/claim/" className="inline-block mt-4 bg-ob text-white rounded-full px-7 py-3.5 font-extrabold">Claim your /name</Link>
              </div>
            ) : result === 'sent' ? (
              <p className="text-xl sm:text-2xl font-medium leading-snug">
                {VAL.heySent(wall.name ?? handle)} <span className="text-[#141414]/70">{VAL.sign}</span>
              </p>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-medium leading-snug">
                  {handle === VAL.handle
                    ? VAL.valWall
                    : <>Send {wall.name} a /hey. Val shows them your /vibe first. You hear nothing until they say yes.</>}
                </p>
                {!signedIn && !sessionLoading ? (
                  <div className="flex flex-col gap-3">
                    <SignIn pitch={<>Sign in with the email on your /name. Val brings you straight back here to send it.</>} cta="Sign in" />
                    <p className="text-sm text-[#141414]/50">No /name yet? <Link href="/claim" className="underline font-semibold text-[#141414]">Claim yours</Link> &mdash; thirty seconds.</p>
                  </div>
                ) : (
                <div className="flex flex-col gap-3 max-w-md">
                  <p className="text-sm text-[#141414]/50">Sending as {me}.</p>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                    placeholder="Optional. One line. Where you met, what you noticed."
                    className="bg-white border-2 border-[#141414]/12 rounded-xl focus:border-ob outline-none px-4 py-3 text-base placeholder:text-[#141414]/35 resize-none" />
                  <button disabled={!signedIn || busy} onClick={sendHey}
                    className="bg-ob text-white text-base font-extrabold rounded-full px-10 py-4 hover:scale-[1.02] transition-transform disabled:opacity-30">
                    {busy ? 'Sending…' : 'Send a /hey'}
                  </button>
                  {error && <p className="text-base font-semibold">{error}</p>}
                </div>
                )}

                <div className="border-2 border-[#141414]/15 rounded-2xl p-5 max-w-md mt-2">
                  <div className="text-xs tracking-[0.2em] uppercase font-semibold mb-1">Not for you? /wing them.</div>
                  {wingResult ? (
                    <p className="text-base font-medium">{wingResult === 'invited' ? 'Sent. Your friend isn\u2019t on /date yet \u2014 Val will invite them.' : `Sent. Val will show your friend /${handle}. If they\u2019re into it, they send the /hey.`} <span className="text-[#141414]/70">{VAL.sign}</span></p>
                  ) : !wing ? (
                    <>
                      <p className="text-sm text-[#141414]/70">Know who {wall.name} is right for? Pass the /name to a friend. They only see this page. Saying yes is theirs.</p>
                      <button onClick={() => setWing(true)} className="mt-3 border-2 border-[#141414] rounded-full px-5 py-2.5 text-sm font-extrabold hover:bg-[#141414] hover:text-white transition-colors">I know who</button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input value={friend} onChange={(e) => setFriend(e.target.value)} placeholder="Friend's /name or email"
                        className="bg-white border-2 border-[#141414]/12 rounded-xl focus:border-ob outline-none px-4 py-3 text-base placeholder:text-[#141414]/35" />
                      <input value={wingNote} onChange={(e) => setWingNote(e.target.value)} placeholder="Why them (optional)"
                        className="bg-white border-2 border-[#141414]/12 rounded-xl focus:border-ob outline-none px-4 py-3 text-base placeholder:text-[#141414]/35" />
                      <button disabled={!signedIn || !friend.trim() || busy} onClick={sendWing}
                        className="bg-ob text-white text-base font-extrabold rounded-full px-8 py-3 hover:scale-[1.02] transition-transform disabled:opacity-30 self-start">Send the /wing</button>
                      {!signedIn && <p className="text-xs text-[#141414]/50">Sign in above first.</p>}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
        {wall && wall.taken && (
          <ReportLink handle={handle} me={me} />
        )}
      </section>
    </main>
  )
}

function ReportLink({ handle, me }: { handle: string; me: string | null }) {
  const [email, setEmail] = useState('')
  const [open, setOpen] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)
  async function send() {
    await (me ? authClient() : getSupabase())?.rpc('report_handle', { p_handle: handle, p_reason: reason || 'report', p_details: null, p_reporter_email: me ?? email, p_chat: null })
    setDone(true)
  }
  if (done) return <p className="text-sm text-[#141414]/50 mt-4">Got it. Val sees it, they don&rsquo;t. {me ? 'They can\u2019t reach you any more. ' : ''}&mdash; Val</p>
  if (blocked) return <p className="text-sm text-[#141414]/50 mt-4">Blocked. /{handle} can&rsquo;t reach you.</p>
  return !open ? (
    <div className="flex gap-4 mt-4 self-start">
      <button onClick={() => setOpen(true)} className="tap text-xs text-[#141414]/50 underline underline-offset-4">Report this /name</button>
      {me && <button onClick={async () => { await authClient()!.rpc('block_handle', { p_handle: handle }); setBlocked(true) }} className="tap text-xs text-[#141414]/50 underline underline-offset-4">Block</button>}
    </div>
  ) : (
    <div className="flex flex-col gap-2 max-w-md mt-4">
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="bg-white border-2 border-[#141414]/12 rounded-xl px-4 py-3 text-base">
        <option value="">Why?</option>
        <option>Not who they say they are</option>
        <option>Harassing or pressuring</option>
        <option>Under 18</option>
        <option>Something else felt off</option>
      </select>
      {!me && <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email, so Val can follow up"
        className="bg-white border-2 border-[#141414]/12 rounded-xl focus:border-ob outline-none px-4 py-3 text-base placeholder:text-[#141414]/35" />}
      <button disabled={!reason || (!me && !/.+@.+\..+/.test(email))} onClick={send} className="bg-ob text-white text-sm font-extrabold rounded-full px-6 py-3 self-start disabled:opacity-30">Send to Val</button>
    </div>
  )
}
