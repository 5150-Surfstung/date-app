'use client'

// The one way in. Anywhere /date needs to know it's really you, this sits
// inline: an email, Val's link, and you land back exactly where you were.
import { useEffect, useState } from 'react'
import { sendLoginLink, verifyCode } from '@/lib/auth'
import { EMAIL_KEY } from '@/lib/handles'

export function SignIn({ pitch, cta = 'Send my link', red, night, onSent }: {
  pitch?: React.ReactNode; cta?: string; red?: boolean; night?: boolean; onSent?: () => void
}) {
  const light = !red && !night
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [wait, setWait] = useState(0)
  useEffect(() => { try { setEmail(localStorage.getItem(EMAIL_KEY) ?? '') } catch {} }, [])
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t) }, [wait])
  useEffect(() => { if (code.length === 6 && !checking) check(code) }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  async function check(c: string) {
    setChecking(true); setError(null)
    try { await verifyCode(email.trim().toLowerCase(), c) }   // session listeners take it from here
    catch (err) { setError(err instanceof Error ? err.message : 'That code didn’t work.'); setCode('') }
    finally { setChecking(false) }
  }

  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  async function go() {
    setBusy(true); setError(null)
    const e = email.trim().toLowerCase()
    try {
      try { localStorage.setItem(EMAIL_KEY, e) } catch {}
      await sendLoginLink(e, location.pathname + location.search)
      setSent(true); setWait(30); setCode(''); onSent?.()
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.') }
    finally { setBusy(false) }
  }

  const field = night
    ? 'bg-white/5 border-2 border-white/20 focus:border-[#FF5CA8] text-[#F6EFFF] placeholder:text-white/40'
    : light
    ? 'bg-white border-2 border-[#141414]/15 focus:border-ob text-[#141414] placeholder:text-[#141414]/35'
    : 'bg-ob-1 border-2 border-ob-3 focus:border-white text-white placeholder:text-chalk-3'
  const btn = night ? 'bg-[#FF5CA8] text-[#140A20]' : light ? 'bg-ob text-white' : 'bg-white text-ob'
  const muted = night ? 'text-[#F6EFFF]/60' : light ? 'text-[#141414]/55' : 'text-chalk-3'
  const strong = night ? 'text-[#F6EFFF]' : light ? 'text-[#141414]' : 'text-white'

  if (sent) return (
    <div className="max-w-md">
      <div className="font-display font-extrabold text-3xl tracking-tight">Enter the code.</div>
      <p className={`mt-2 text-base ${muted}`}>Val sent a 6-digit code to <b className={strong}>{email.trim()}</b>. Not there in a minute? Check Spam and Promotions.</p>
      <label className="relative block mt-4">
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric" autoComplete="one-time-code" autoFocus aria-label="6-digit code" disabled={checking}
          className="absolute inset-0 w-full h-full opacity-0 text-[16px]" />
        <div className="grid grid-cols-6 gap-2 pointer-events-none" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-16 rounded-2xl grid place-items-center font-display font-extrabold text-3xl tabular-nums border-2 ${field} ${i === code.length && !checking ? (night ? '!border-[#FF5CA8]' : light ? '!border-ob' : '!border-white') : ''}`}>
              {code[i] ?? ''}
            </div>
          ))}
        </div>
      </label>
      {checking && <p className={`mt-3 text-sm font-semibold ${muted}`}>Checking…</p>}
      {error && <p className="mt-3 text-sm font-semibold text-ob">{error}</p>}
      <div className={`mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold ${muted}`}>
        <button onClick={() => { if (wait <= 0) go() }} disabled={wait > 0 || busy} className="tap underline underline-offset-4 disabled:no-underline">
          {wait > 0 ? `Send again in ${wait}s` : busy ? 'Sending…' : 'Send a new code'}
        </button>
        <button onClick={() => { setSent(false); setError(null) }} className="tap underline underline-offset-4">Different email</button>
      </div>
      <p className={`mt-3 text-xs ${muted}`}>The email also has a one-tap link, if you&rsquo;re reading it on this phone.</p>
    </div>
  )
  return (
    <div className="max-w-md">
      {pitch && <p className={`text-base mb-3 ${muted}`}>{pitch}</p>}
      <form onSubmit={(e) => { e.preventDefault(); if (ok && !busy) go() }} className="flex flex-col sm:flex-row gap-2">
        <input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
          className={`flex-1 min-w-0 rounded-full px-5 py-3.5 outline-none ${field}`} />
        <button type="submit" disabled={!ok || busy} className={`rounded-full px-6 py-3.5 font-extrabold disabled:opacity-40 whitespace-nowrap ${btn}`}>
          {busy ? 'Sending…' : cta}
        </button>
      </form>
      {error && <p className="mt-2 text-sm font-semibold">{error}</p>}
      <p className={`mt-2 text-xs ${muted}`}>No password. Val emails you a 6-digit code.</p>
    </div>
  )
}
