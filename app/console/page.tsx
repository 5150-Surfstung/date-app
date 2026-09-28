'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell, NeedLogin, Pill } from '../ui'
import { authClient, useSession } from '@/lib/auth'
import { suggestPairs, draftIntro, type Person, type Pair } from '@/lib/match'
import { VENUES } from '@/lib/venues'
import { QUESTIONS } from '@/lib/questions'

type Console = {
  handles: (Person & { founding: number | null; created_at: string; app_id: string | null; photo_keys: string[] | null; voice_key: string | null })[]
  applications: any[]; heys: any[]; wings: any[]; chats: any[]; signals: any[]; debriefs: any[]; weights: any[]
}

const TABS = ['Pairs', 'Inbox', 'People', 'Chats', 'Signals', 'Debriefs'] as const

export default function ConsolePage() {
  const { email, loading } = useSession()
  const [data, setData] = useState<Console | null | undefined>(undefined)
  const [tab, setTab] = useState<(typeof TABS)[number]>('Pairs')
  const [note, setNote] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    const { data } = await authClient()!.rpc('val_console')
    setData(data as Console | null)
  }
  useEffect(() => { if (email) load() }, [email])

  const pairs = useMemo<Pair[]>(() => {
    if (!data) return []
    const people = data.handles.filter((h) => h.visibility !== 'private' || true)
    const existing = new Set<string>(data.chats.map((c: any) => [c.a_handle, c.b_handle].sort().join('|')))
    return suggestPairs(people, data.signals, data.heys, existing, 24, data.wings ?? [])
  }, [data])

  async function pair(p: Pair) {
    const key = p.a.handle + '|' + p.b.handle
    setBusy(key)
    const text = note[key] || draftIntro(p, VENUES[0].name)
    await authClient()!.rpc('val_pair', { p_a: p.a.handle, p_b: p.b.handle, p_note: text })
    setBusy(null); load()
  }

  async function setStatus(id: string, status: string) {
    await authClient()!.rpc('set_application_status', { p_id: id, p_status: status }); load()
  }

  if (loading || data === undefined) return <AppShell title="Val's console"><p>One sec…</p></AppShell>
  if (!email) return <AppShell title="Val's console"><NeedLogin /></AppShell>
  if (data === null) return <AppShell title="Val's console"><h1 className="font-display font-extrabold text-4xl">Val only.</h1><p className="mt-2 text-[#141414]/60">This email isn&rsquo;t on the list.</p></AppShell>

  const pending = data.heys.filter((h: any) => h.status === 'sent' || h.status === 'previewed')
  const byHandle = Object.fromEntries(data.handles.map((h) => [h.handle, h]))
  const counts = { people: data.handles.length, vibes: data.applications.length, heys: pending.length, chats: data.chats.filter((c: any) => c.status === 'open').length }

  return (
    <AppShell title="Val's console">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display font-extrabold text-4xl tracking-tight">Charleston · Season I</h1>
        <div className="flex gap-6 text-sm">
          {Object.entries(counts).map(([k, v]) => (
            <div key={k}><div className="font-display font-extrabold text-2xl tabular-nums">{v}</div><div className="text-xs uppercase tracking-[0.15em] text-[#141414]/50">{k}</div></div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-[#141414]/10 pb-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-extrabold ${tab === t ? 'bg-[#141414] text-white' : 'hover:bg-[#141414]/5'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Pairs' && (
        <div className="mt-6 grid gap-4">
          <p className="text-sm text-[#141414]/60 max-w-xl">Val&rsquo;s suggestions, best first. Edit the note or send hers. Pairing opens a /chat with the 48-hour clock.</p>
          {pairs.length === 0 && <p className="text-sm">Nothing to pair yet. Val needs at least two people who fit.</p>}
          {pairs.map((p) => {
            const key = p.a.handle + '|' + p.b.handle
            return (
              <div key={key} className="border-2 border-[#141414]/10 rounded-2xl p-5 grid md:grid-cols-[1fr_auto] gap-4">
                <div>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="font-display font-extrabold text-2xl tracking-tight">/{p.a.handle} <span className="text-ob">/{p.a.tag}</span></span>
                    <span className="text-[#141414]/40">+</span>
                    <span className="font-display font-extrabold text-2xl tracking-tight">/{p.b.handle} <span className="text-ob">/{p.b.tag}</span></span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[#141414]/10 max-w-xs"><div className="h-full rounded-full bg-ob" style={{ width: `${p.score}%` }} /></div>
                  <ul className="mt-3 text-sm grid gap-0.5">
                    {p.reasons.map((r) => <li key={r}>&#10003; {r}</li>)}
                    {p.flags.map((f) => <li key={f} className="text-ob">&#9888; {f}</li>)}
                  </ul>
                  <textarea value={note[key] ?? draftIntro(p, VENUES[0].name)} onChange={(e) => setNote({ ...note, [key]: e.target.value })} rows={3}
                    className="mt-3 w-full border-2 border-[#141414]/10 focus:border-ob outline-none rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="flex md:flex-col items-start gap-3">
                  <div className="font-display font-extrabold text-4xl tabular-nums">{p.score}</div>
                  <Pill primary onClick={() => pair(p)} disabled={busy === key}>{busy === key ? 'Pairing…' : 'Pair them'}</Pill>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'Inbox' && (
        <div className="mt-6 grid gap-3">
          {pending.length === 0 && <p className="text-sm">No /heys waiting.</p>}
          {pending.map((h: any) => {
            const from = data.handles.find((x) => x.email === h.from_email)
            return (
              <div key={h.id} className="border-2 border-[#141414]/10 rounded-2xl p-4 flex flex-wrap items-baseline gap-3">
                <span className="font-display font-extrabold text-xl">/{from?.handle ?? '?'}</span>
                <span className="text-[#141414]/40">&rarr;</span>
                <span className="font-display font-extrabold text-xl">/{h.to_handle}</span>
                {h.note && <span className="text-sm italic">&ldquo;{h.note}&rdquo;</span>}
                <span className="ml-auto text-xs text-[#141414]/50">{new Date(h.created_at).toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'People' && (
        <div className="mt-6 grid gap-3">
          {data.handles.map((h) => (
            <details key={h.handle} className="border-2 border-[#141414]/10 rounded-2xl p-4">
              <summary className="cursor-pointer flex flex-wrap items-baseline gap-3">
                <span className="font-display font-extrabold text-xl">/{h.handle} {h.tag && <span className="text-ob">/{h.tag}</span>}</span>
                <span className="text-sm font-semibold">{h.name}{h.age ? `, ${h.age}` : ''}{h.hood ? ` · ${h.hood}` : ''}</span>
                {h.founding && <span className="text-xs font-extrabold text-ob">#{String(h.founding).padStart(3, '0')}</span>}
                <span className="ml-auto text-xs uppercase tracking-[0.15em] text-[#141414]/50">{h.app_status ?? 'no /vibe'} &middot; {h.visibility}</span>
              </summary>
              <div className="mt-4 text-sm grid gap-2">
                <div className="text-[#141414]/60">{h.email} &middot; {h.identity ?? '?'} seeking {h.seeking ?? '?'}</div>
                {h.answers && QUESTIONS.filter((q) => h.answers?.[q.id]).map((q) => (
                  <div key={q.id}><span className="text-[#141414]/50">{q.prompt}</span> &mdash; {h.answers![q.id]}</div>
                ))}
                {h.app_id && (
                  <div className="flex gap-2 mt-2">
                    <Pill primary onClick={() => setStatus(h.app_id!, 'approved')}>Approve</Pill>
                    <Pill onClick={() => setStatus(h.app_id!, 'waitlisted')}>Waitlist</Pill>
                    <Pill onClick={() => setStatus(h.app_id!, 'rejected')}>Decline</Pill>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}

      {tab === 'Chats' && (
        <div className="mt-6 grid gap-3">
          {data.chats.map((c: any) => (
            <div key={c.id} className="border-2 border-[#141414]/10 rounded-2xl p-4 flex flex-wrap items-baseline gap-3">
              <span className="font-display font-extrabold text-xl">/{c.a_handle} + /{c.b_handle}</span>
              <span className="text-xs uppercase tracking-[0.15em] font-extrabold text-ob">{c.status}</span>
              {c.spot_slug && <span className="text-sm">{VENUES.find((v) => v.slug === c.spot_slug)?.name} &middot; {c.date_at && new Date(c.date_at).toLocaleString()}</span>}
              <span className="ml-auto text-xs text-[#141414]/50">closes {new Date(c.closes_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'Signals' && (
        <div className="mt-6 grid gap-2">
          {data.signals.map((s: any) => (
            <div key={s.id} className="text-sm flex flex-wrap gap-3 border-b border-[#141414]/10 py-2">
              <span className="font-extrabold uppercase text-xs tracking-[0.15em] w-16">{s.kind}</span>
              <span>{VENUES.find((v) => v.slug === s.venue_slug)?.name ?? s.venue_slug}</span>
              <span className="text-[#141414]/60">{data.handles.find((h) => h.email === s.email)?.handle ? '/' + data.handles.find((h) => h.email === s.email)!.handle : s.email}</span>
              {s.note && <span className="italic">&ldquo;{s.note}&rdquo;</span>}
              <span className="ml-auto text-xs text-[#141414]/50">{new Date(s.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'Debriefs' && (
        <div className="mt-6 grid gap-2">
          {data.debriefs.length === 0 && <p className="text-sm">No dates debriefed yet.</p>}
          {data.debriefs.map((d: any) => (
            <div key={d.id} className="text-sm flex flex-wrap gap-3 border-b border-[#141414]/10 py-2">
              <span className="font-extrabold">{byHandle[data.handles.find((h) => h.email === d.from_email)?.handle ?? '']?.handle ? '/' + data.handles.find((h) => h.email === d.from_email)!.handle : d.from_email}</span>
              <span className="uppercase text-xs tracking-[0.15em] font-extrabold text-ob">{d.outcome.replace('_', ' ')}</span>
              <span className="ml-auto text-xs text-[#141414]/50">{new Date(d.created_at).toLocaleString()}</span>
            </div>
          ))}
          {data.weights.length > 0 && (
            <div className="mt-6 text-sm">
              <div className="text-xs uppercase tracking-[0.15em] text-[#141414]/50 mb-2">Val&rsquo;s per-person read</div>
              {data.weights.map((w: any) => <div key={w.email}>{w.email}: {JSON.stringify(w.w)}</div>)}
            </div>
          )}
        </div>
      )}
    </AppShell>
  )
}
