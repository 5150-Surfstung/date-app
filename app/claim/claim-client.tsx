'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { authClient, useSession } from '@/lib/auth'
import {
  HANDLE_RE, RESERVED, TAGS, HANDLE_KEY,
  normalizeHandle, type Tag,
} from '@/lib/handles'
import { SignIn } from '../gate'

const PENDING = 'date:pending-claim'
type Pending = { handle: string; name: string; tag: Tag | null; priv: boolean }
import { DEMO_CREW } from '@/lib/demo'
import { VAL } from '@/lib/val'

type Avail = 'idle' | 'checking' | 'open' | 'taken' | 'reserved' | 'bad'

export default function ClaimClient() {
  const { email: me, loading: sessionLoading } = useSession()
  const [name, setName] = useState('')
  const [terms, setTerms] = useState(false)
  const [gate, setGate] = useState(false)
  const [already, setAlready] = useState<string | null>(null)
  const [handle, setHandle] = useState('')
  const [tag, setTag] = useState<Tag | null>(null)
  const [priv, setPriv] = useState(false)
  const [avail, setAvail] = useState<Avail>('idle')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // Back from Val's link with a claim waiting? Finish it. Already have one? Say so.
  useEffect(() => {
    if (sessionLoading || !me) return
    authClient()?.rpc('my_home').then(({ data }) => {
      if (data?.handle?.handle) { setAlready(data.handle.handle); return }
      let p: Pending | null = null
      try { p = JSON.parse(localStorage.getItem(PENDING) ?? 'null') } catch {}
      if (p) {
        setHandle(p.handle); setName(p.name); setTag(p.tag); setPriv(p.priv); setTerms(true)
        claim(p)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, sessionLoading])

  // Live availability, debounced.
  useEffect(() => {
    if (!handle) { setAvail('idle'); return }
    if (!HANDLE_RE.test(handle)) { setAvail('bad'); return }
    if (RESERVED.has(handle)) { setAvail('reserved'); return }
    setAvail('checking')
    const t = setTimeout(async () => {
      const supabase = getSupabase()
      if (!supabase) return
      const { data } = await supabase.rpc('handle_wall', { p_handle: handle })
      setAvail(data?.taken ? 'taken' : 'open')
    }, 350)
    return () => clearTimeout(t)
  }, [handle])

  const canClaim = name.trim() && terms && avail === 'open' && !busy

  function start() {
    const p: Pending = { handle, name: name.trim(), tag, priv }
    if (me) { claim(p); return }
    try { localStorage.setItem(PENDING, JSON.stringify(p)) } catch {}
    setGate(true)
  }

  async function claim(p: Pending) {
    setBusy(true)
    setError(null)
    try {
      const supabase = authClient()
      if (!supabase) throw new Error('Not configured yet.')
      const { data, error } = await supabase.rpc('claim_handle', {
        p_handle: p.handle, p_name: p.name, p_tag: p.tag, p_private: p.priv, p_terms: true,
      })
      if (error) throw new Error('Something went wrong. Try again.')
      const msgs: Record<string, string> = {
        taken: `/${p.handle} just got taken. Try another.`,
        email_taken: 'This email already has a /name.',
        login: 'Sign in first.',
        terms: 'Tick the box first.',
        reserved: 'That one’s reserved.',
        bad: 'Letters, numbers, underscores. 3 to 20 characters.',
      }
      try { localStorage.removeItem(PENDING) } catch {}
      if (data !== 'ok') throw new Error(msgs[data] ?? 'Something went wrong.')
      try { localStorage.setItem(HANDLE_KEY, p.handle) } catch {}
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const availText: Record<Avail, string> = {
    idle: '',
    checking: 'Checking…',
    open: `/${handle} is yours if you want it.`,
    taken: `/${handle} is taken.`,
    reserved: 'That one’s reserved.',
    bad: 'Letters, numbers, underscores. 3 to 20 characters.',
  }

  if (already && !done) {
    return (
      <Shell>
        <div className="text-xs tracking-[0.2em] uppercase font-medium mb-3">You&rsquo;re already on</div>
        <h1 className="font-display font-extrabold text-6xl sm:text-7xl leading-[0.95] tracking-[-0.03em] break-all">/{already}</h1>
        <p className="mt-6 text-xl text-chalk-2 font-medium">One /name per person. It&rsquo;s yours.</p>
        <Link href="/me/" className="inline-block mt-8 bg-white text-ob text-base font-extrabold rounded-full px-9 py-4">Go to /me</Link>
      </Shell>
    )
  }

  if (gate && !me) {
    return (
      <Shell>
        <div className="text-xs tracking-[0.2em] uppercase font-medium mb-3">Last step</div>
        <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.03em] break-all">/{handle} is held.</h1>
        <p className="mt-6 text-xl text-chalk-2 font-medium leading-snug max-w-lg">Your /name is tied to your email so nobody can pose as you. Val sends a link; tap it and /{handle} is yours.</p>
        <div className="mt-8"><SignIn cta={`Claim /${handle}`} /></div>
        <button onClick={() => setGate(false)} className="tap mt-6 text-sm text-chalk-3 underline underline-offset-4">Change something</button>
      </Shell>
    )
  }

  if (done) {
    return (
      <Shell>
        <h1 className="font-display font-extrabold text-6xl sm:text-7xl leading-[0.95] tracking-[-0.03em] break-all">
          /{handle}{tag && <span className="block text-4xl sm:text-5xl mt-2 text-chalk-2">/{tag}</span>}
        </h1>
        <p className="mt-6 text-xl sm:text-2xl font-medium leading-snug max-w-lg">
          {VAL.claimed(handle)} <span className="text-chalk-2">{VAL.sign}</span>
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link href={`/badge/?h=${handle}`} className="bg-white text-ob text-base font-extrabold rounded-full px-9 py-4 text-center hover:scale-[1.02] transition-transform">
            Print my badge
          </Link>
          <Link href="/apply" className="border-2 border-white text-base font-extrabold rounded-full px-9 py-4 text-center hover:bg-gold-faint transition-colors">
            Finish my /vibe
          </Link>
        </div>
        <p className="mt-8 text-sm text-chalk-3">
          Founding member. Your number is on your badge. Season I is free. Your /hey link: <span className="font-semibold text-chalk">/{handle}</span>
        </p>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="text-xs tracking-[0.2em] uppercase font-medium mb-3">Claim your /name</div>
      <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.03em] [text-wrap:balance]">
        Give out your /name, not your number.
      </h1>
      <p className="mt-6 text-xl text-chalk-2 font-medium leading-snug max-w-lg">
        Like {DEMO_CREW.slice(0, 3).map((d) => `/${d.handle} /${d.tag}`).join(', ')}. Short ones go first.
      </p>

      <div className="mt-10 grid gap-5 max-w-md">
        <label className="grid gap-1.5">
          <span className="text-xs tracking-[0.18em] uppercase text-chalk-2">Your /name</span>
          <div className="flex items-center bg-ob-1 border-2 border-ob-3 rounded-xl focus-within:border-gold px-4">
            <span className="font-display font-extrabold text-2xl">/</span>
            <input
              value={handle}
              onChange={(e) => setHandle(normalizeHandle(e.target.value))}
              placeholder="yourname"
              autoCapitalize="none"
              autoCorrect="off"
              className="bg-transparent outline-none py-3 text-2xl font-display font-extrabold w-full placeholder:text-chalk-3 placeholder:font-medium"
            />
          </div>
          <span className={`text-sm min-h-5 ${avail === 'open' ? 'font-semibold' : 'text-chalk-2'}`}>
            {availText[avail]}
          </span>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs tracking-[0.18em] uppercase text-chalk-2">First name</span>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="bg-ob-1 border-2 border-ob-3 rounded-xl focus:border-gold outline-none px-4 py-3 text-base" />
        </label>


        <div className="grid gap-2">
          <span className="text-xs tracking-[0.18em] uppercase text-chalk-2">Your /tag &mdash; what you&rsquo;re here for</span>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button key={t.value} onClick={() => setTag(tag === t.value ? null : t.value)}
                title={t.line}
                className={`px-4 py-2.5 border-2 rounded-full text-base font-extrabold transition-colors ${tag === t.value ? 'bg-white text-ob border-white' : 'border-ob-3 hover:border-white'}`}>
                /{t.value}
              </button>
            ))}
          </div>
          <span className="text-sm text-chalk-2 min-h-5">
            {tag ? TAGS.find((t) => t.value === tag)!.line : 'Optional. Change it any time.'}
          </span>
        </div>

        <button onClick={() => setPriv(!priv)}
          className={`text-left px-5 py-4 border-2 rounded-2xl transition-colors ${priv ? 'border-white bg-gold-faint' : 'border-ob-3 hover:border-ob-4'}`}>
          <div className="font-extrabold text-base">{priv ? 'Private — on' : 'Private'}</div>
          <div className="text-sm text-chalk-2 mt-0.5">Your /name shows nothing. Only matchmaker intros reach you.</div>
        </button>

        <label className="flex items-start gap-3 cursor-pointer select-none py-1">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 w-5 h-5 accent-white shrink-0" />
          <span className="text-sm text-chalk-2 leading-snug">I&rsquo;m 18 or older and I agree to the <Link href="/terms/" className="underline text-chalk">Terms</Link> and <Link href="/privacy/" className="underline text-chalk">Privacy</Link>.</span>
        </label>

        {me && <p className="text-sm text-chalk-3 -mb-2">Claiming as {me}.</p>}
        <button disabled={!canClaim} onClick={start}
          className="bg-white text-ob text-base font-extrabold rounded-full px-10 py-4 hover:scale-[1.02] transition-transform disabled:opacity-30 mt-2">
          {busy ? 'Claiming…' : `Claim /${handle || 'name'}`}
        </button>
        {error && <p className="text-base font-semibold">{error}</p>}
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh flex flex-col px-6 sm:px-12 pb-12">
      <header className="flex items-center justify-between pt-8 pb-10">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs sm:text-sm tracking-[0.2em] uppercase text-chalk-2 font-medium">/name</span>
      </header>
      <section className="max-w-2xl">{children}</section>
    </main>
  )
}
