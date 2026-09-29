'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '../ui'
import { redeemLoginToken, useSession } from '@/lib/auth'
import { SignIn } from '../gate'
import Link from 'next/link'

export default function LoginPage() {
  const { email: me } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  // Tapped the link in Val's email: /login/?th=…&next=…
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const th = q.get('th')
    if (!th) return
    const next = q.get('next') || '/me/'
    setRedeeming(true)
    redeemLoginToken(th)
      .then(() => location.replace(next.startsWith('/') && !next.startsWith('//') ? next : '/inbox/'))
      .catch((e) => { setError(e instanceof Error ? e.message : 'That link didn\u2019t work.'); setRedeeming(false); history.replaceState(null, '', '/login/') })
  }, [])

  // Signed in by code on this page: go home.
  useEffect(() => {
    if (!me || redeeming) return
    const next = new URLSearchParams(window.location.search).get('next')
    if (next && next.startsWith('/') && !next.startsWith('//')) location.replace(next)
  }, [me, redeeming])

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
      ) : (
        <div className="max-w-md">
          <h1 className="font-display font-extrabold text-4xl tracking-tight">The email on your /name.</h1>
          <p className="mt-3 mb-6 text-base text-[#141414]/70">Val emails you a code. Type it in. That&rsquo;s the whole login.</p>
          <SignIn cta="Send my code" />
          {error && <p className="mt-3 text-sm font-semibold text-ob">{error}</p>}
          <p className="mt-6 text-sm text-[#141414]/60">No /name yet? <Link href="/claim/" className="underline">Claim one</Link> first.</p>
        </div>
      )}
    </AppShell>
  )
}
