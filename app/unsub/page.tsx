'use client'

// One tap from an email footer. No login: the token in the link is the key.
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

const LABEL: Record<string, string> = { heys: '/hey and /wing emails', chats: 'new /chat emails', dates: 'morning-after emails', all: 'all of Val’s emails' }

function Unsub() {
  const q = useSearchParams()
  const t = q.get('t') ?? ''
  const k = LABEL[q.get('k') ?? ''] ? (q.get('k') as string) : 'all'
  const [state, setState] = useState<'working' | 'ok' | 'bad'>('working')
  const [kind, setKind] = useState(k)

  async function run(which: string) {
    setState('working'); setKind(which)
    const { data } = await getSupabase()!.rpc('date_unsubscribe', { p_token: t, p_kind: which })
    setState(data === 'ok' ? 'ok' : 'bad')
  }
  useEffect(() => { if (/^[0-9a-f-]{36}$/i.test(t)) run(k); else setState('bad') }, [t, k])

  return (
    <main className="page min-h-dvh flex flex-col bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 py-8">
      <Link href="/" className="self-start font-display font-extrabold text-3xl tracking-tight">/date</Link>
      <div className="my-auto max-w-md">
        {state === 'working' && <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em]">One sec…</h1>}
        {state === 'bad' && <>
          <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em] leading-[0.95]">That link didn&rsquo;t work.</h1>
          <p className="mt-4 text-lg text-[#141414]/70">Sign in and change your email settings directly.</p>
          <Link href="/me/settings/" className="inline-block mt-6 bg-ob text-white rounded-full px-7 py-3.5 font-extrabold">Email settings</Link>
        </>}
        {state === 'ok' && <>
          <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em] leading-[0.95]">Done.</h1>
          <p className="mt-4 text-lg text-[#141414]/70">No more {LABEL[kind]}. Safety check-ins still come through, always. &mdash; Val</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {kind !== 'all' && <button onClick={() => run('all')} className="border-2 border-[#141414] rounded-full px-6 py-3 font-extrabold">Stop all of them</button>}
            <Link href="/me/settings/" className="bg-ob text-white rounded-full px-6 py-3 font-extrabold">Email settings</Link>
          </div>
        </>}
      </div>
    </main>
  )
}

export default function Page() {
  return <Suspense fallback={null}><Unsub /></Suspense>
}
