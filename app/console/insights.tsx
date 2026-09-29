'use client'

// Launch instruments. Funnel: where people drop between claiming a /name and
// a /second date. Health: what's breaking on members' phones, and login load.
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth'

type Funnel = Record<'claimed' | 'vibe' | 'approved' | 'verified' | 'intro' | 'date_set' | 'date_done' | 'second', number> & { this_week: { claimed: number; vibe: number; intros: number } }
type Health = { last_24h: number; logins_1h: number; top: { message: string; n: number; last: string; url: string; ua: string; stack: string | null }[] }

const STEPS: [keyof Funnel, string, string][] = [
  ['claimed', 'Claimed a /name', 'Top of the funnel.'],
  ['vibe', 'Finished the /vibe', 'If this drops hard, the interview is too long or too scary.'],
  ['approved', 'Approved', 'Your pace. Don’t let /vibes wait more than a day.'],
  ['verified', 'Verified', 'Photos and voice checked.'],
  ['intro', 'Got a first intro', 'Val’s job. If this lags, pair more.'],
  ['date_set', 'Set a date', 'The 48-hour clock at work.'],
  ['date_done', 'Went on the date', 'No-shows show up here.'],
  ['second', 'Said /second', 'The only number that matters.'],
]

export function FunnelTab() {
  const [f, setF] = useState<Funnel | null | undefined>(undefined)
  useEffect(() => { authClient()!.rpc('val_funnel').then(({ data }) => setF(data as Funnel | null)) }, [])
  if (f === undefined) return <p className="mt-6 text-sm">Counting…</p>
  if (!f) return <p className="mt-6 text-sm">Val only.</p>
  const top = Math.max(f.claimed, 1)
  return (
    <div className="mt-6 grid gap-6 max-w-3xl">
      <div className="grid grid-cols-3 gap-3">
        {([['claimed', '/names this week'], ['vibe', '/vibes this week'], ['intros', 'Intros this week']] as const).map(([k, label]) => (
          <div key={k} className="rounded-2xl border-2 border-[#141414]/10 p-4">
            <div className="font-display font-extrabold text-3xl tabular-nums">{f.this_week[k]}</div>
            <div className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#141414]/50 mt-1">{label}</div>
          </div>
        ))}
      </div>
      <ol className="grid gap-2">
        {STEPS.map(([k, label, hint], i) => {
          const n = f[k] as number
          const prev = i === 0 ? n : (f[STEPS[i - 1][0]] as number)
          const kept = prev ? Math.round((n / prev) * 100) : 0
          const weak = i > 0 && prev >= 5 && kept < 50
          return (
            <li key={k} className="grid grid-cols-[1fr_auto] gap-x-4 items-center">
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-extrabold">{label}</span>
                  <span className="text-xs text-[#141414]/50">{i > 0 && prev ? <span className={weak ? 'text-ob font-extrabold' : ''}>{kept}% of the step before</span> : null}</span>
                </div>
                <div className="mt-1 h-3 rounded-full bg-[#141414]/8 overflow-hidden">
                  <div className={`h-full rounded-full ${k === 'second' ? 'bg-ob' : 'bg-[#141414]'}`} style={{ width: `${Math.max(2, (n / top) * 100)}%` }} />
                </div>
                <div className="text-xs text-[#141414]/45 mt-1">{hint}</div>
              </div>
              <div className="font-display font-extrabold text-2xl tabular-nums w-14 text-right">{n}</div>
            </li>
          )
        })}
      </ol>
      <p className="text-xs text-[#141414]/45">Real members only; demo and test accounts are left out. A step in red kept under half of the step before it.</p>
    </div>
  )
}

export function HealthTab() {
  const [h, setH] = useState<Health | null | undefined>(undefined)
  const [open, setOpen] = useState<number | null>(null)
  useEffect(() => { authClient()!.rpc('val_health').then(({ data }) => setH(data as Health | null)) }, [])
  if (h === undefined) return <p className="mt-6 text-sm">Checking…</p>
  if (!h) return <p className="mt-6 text-sm">Val only.</p>
  return (
    <div className="mt-6 grid gap-6 max-w-3xl">
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-2xl border-2 p-4 ${h.last_24h ? 'border-ob' : 'border-[#141414]/10'}`}>
          <div className={`font-display font-extrabold text-3xl tabular-nums ${h.last_24h ? 'text-ob' : ''}`}>{h.last_24h}</div>
          <div className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#141414]/50 mt-1">Errors, last 24 hours</div>
        </div>
        <div className="rounded-2xl border-2 border-[#141414]/10 p-4">
          <div className="font-display font-extrabold text-3xl tabular-nums">{h.logins_1h}</div>
          <div className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#141414]/50 mt-1">Login codes, last hour (cap 250)</div>
        </div>
      </div>
      {h.top.length === 0 ? <p className="text-sm">Nothing broken this week. Good.</p> : (
        <ul className="grid gap-2">
          {h.top.map((e, i) => (
            <li key={i} className="rounded-2xl border-2 border-[#141414]/10 p-4 text-sm">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-extrabold break-words">{e.message}</span>
                  <span className="font-display font-extrabold text-xl tabular-nums shrink-0">&times;{e.n}</span>
                </div>
                <div className="text-xs text-[#141414]/50 mt-1">{e.url} &middot; last {new Date(e.last).toLocaleString()}</div>
              </button>
              {open === i && <pre className="mt-3 text-xs whitespace-pre-wrap break-words bg-[#141414]/[0.04] rounded-xl p-3 max-h-64 overflow-auto">{e.ua}{'\n\n'}{e.stack ?? 'no stack'}</pre>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
