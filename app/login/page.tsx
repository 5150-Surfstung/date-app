'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '../ui'
import { redeemLoginToken, sendLoginLink, useSession } from '@/lib/auth'
import Link from 'next/link'

export default function LoginPage() {
  const { email: me } = useSession()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  // Tapped the link in Val's email: /login/?th=…&next=…
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const th = q.get('th')
    if (!th) return
    const next = q.get('next') || '/inbox/'
    setRedeeming(true)
    redeemLoginToken(th)
      .then(() => location.replace(next.startsWith('/') && !next.startsWith('//') ? next : '/inbox/'))
      .catch((e) => { setError(e instanceof Error ? e.message : 'That link didn\u2019t work.'); setRedeeming(false); history.replaceState(null, '', '/login/') })
  }, [])

  async function go() {
    setBusy(true); setError(null)
    try { await sendLoginLink(email.trim().toLowerCase()); setSent(true) }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setBusy(false) }
  }

  return (
    <AppShell title="Log in">
      {redeeming ? (
        <div className="max-w-md"><h1 className="font-display font-extrabold text-4xl tracking-tight">Letting you in…</h1></div>
      ) : me ? (
        <div className="max-w-md">
          <h1 className="font-display font-extrabold text-4xl tracking-tight">You&rsquo;re in as {me}.</h1>
          <div className="mt-6 flex gap-3">
            <Link href="/inbox/" className="bg-ob text-white rounded-full px-6 py-3 font-extrabold">Inbox</Link>
            <Link href="/chat/" className="border-2 border-[#141414] rounded-full px-6 py-3 font-extrabold">/chat</Link>
          </div>
        </div>
      ) : sent ? (
        <div className="max-w-md">
          <h1 className="font-display font-extrabold text-4xl tracking-tight">Check your email.</h1>
          <p className="mt-3 text-base text-[#141414]/70">A link is on its way to <b>{email}</b>. Tap it and you&rsquo;re in. No password, ever.</p>
        </div>
      ) : (
        <div className="max-w-md">
          <h1 className="font-display font-extrabold text-4xl tracking-tight">The email on your /name.</h1>
          <p className="mt-3 text-base text-[#141414]/70">We send a link. You tap it. That&rsquo;s the whole login.</p>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
            className="mt-6 w-full border-2 border-[#141414]/20 focus:border-ob outline-none rounded-xl px-4 py-3 text-base" />
          <button onClick={go} disabled={!/.+@.+\..+/.test(email) || busy}
            className="mt-4 bg-ob text-white rounded-full px-7 py-3.5 font-extrabold disabled:opacity-40">
            {busy ? 'Sending…' : 'Send my link'}
          </button>
          {error && <p className="mt-3 text-sm font-semibold text-ob">{error}</p>}
          <p className="mt-6 text-sm text-[#141414]/60">No /name yet? <Link href="/claim/" className="underline">Claim one</Link> first.</p>
        </div>
      )}
    </AppShell>
  )
}
