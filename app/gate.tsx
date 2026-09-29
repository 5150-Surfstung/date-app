'use client'

// The one way in. Anywhere /date needs to know it's really you, this sits
// inline: an email, Val's link, and you land back exactly where you were.
import { useEffect, useState } from 'react'
import { sendLoginLink } from '@/lib/auth'
import { EMAIL_KEY } from '@/lib/handles'

export function SignIn({ pitch, cta = 'Send my link', light, night, onSent }: {
  pitch?: React.ReactNode; cta?: string; light?: boolean; night?: boolean; onSent?: () => void
}) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { try { setEmail(localStorage.getItem(EMAIL_KEY) ?? '') } catch {} }, [])

  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  async function go() {
    setBusy(true); setError(null)
    const e = email.trim().toLowerCase()
    try {
      try { localStorage.setItem(EMAIL_KEY, e) } catch {}
      await sendLoginLink(e, location.pathname + location.search)
      setSent(true); onSent?.()
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
      <div className="font-display font-extrabold text-3xl tracking-tight">Check your email.</div>
      <p className={`mt-2 text-base ${muted}`}>Val sent a link to <b className={strong}>{email.trim()}</b>. Tap it and you land right back here, signed in.</p>
      <button onClick={() => setSent(false)} className={`tap mt-3 text-sm font-semibold underline underline-offset-4 ${muted}`}>Use a different email</button>
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
      <p className={`mt-2 text-xs ${muted}`}>No password. One tap from your inbox.</p>
    </div>
  )
}
