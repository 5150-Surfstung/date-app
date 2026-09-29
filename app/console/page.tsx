'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell, NeedLogin, Pill } from '../ui'
import { authClient, useSession } from '@/lib/auth'
import { suggestPairs, draftIntro, type Mults, type Person, type Pair } from '@/lib/match'
import { getMults } from '@/lib/learn'
import { LearningTab } from './learning'
import { ValFlags } from './flags'
import { useSpots } from '@/lib/venues'
import { QUESTIONS } from '@/lib/questions'
import { askVal, notify } from '@/lib/val'
import System from './system'
import { FunnelTab, HealthTab } from './insights'
import { SpotsTab } from './spots'
import { ApproveTab } from './approve'
import { TagLine } from '../tags'

type Console = {
  handles: (Person & { founding: number | null; created_at: string; app_id: string | null; photo_keys: string[] | null; voice_key: string | null; verified: boolean; benched?: boolean; strikes?: number })[]
  applications: any[]; heys: any[]; wings: any[]; chats: any[]; signals: any[]; debriefs: any[]; weights: any[]; reports: any[]
}

const TABS = ['Approve', 'Pairs', 'Spots', 'Tonight', 'Inbox', 'People', 'Chats', 'Signals', 'Debriefs', 'Learning', 'Reports', 'Funnel', 'Health', 'System'] as const

export default function ConsolePage() {
  const { email, loading } = useSession()
  const [data, setData] = useState<Console | null | undefined>(undefined)
  const [tab, setTab] = useState<(typeof TABS)[number]>('Approve')
  const [note, setNote] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [reads, setReads] = useState<Record<string, string>>({})
  const [thinking, setThinking] = useState<string | null>(null)
  const spots = useSpots()
  // Emails link straight to a tab: /console/?tab=Spots
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    if (t && (TABS as readonly string[]).includes(t)) setTab(t as (typeof TABS)[number])
  }, [])

  async function load() {
    const { data } = await authClient()!.rpc('val_console')
    setData(data as Console | null)
  }
  useEffect(() => { if (email) load() }, [email])
  const [mults, setMults] = useState<Mults>({})
  useEffect(() => { getMults().then(setMults) }, [])

  const pairs = useMemo<Pair[]>(() => {
    if (!data) return []
    const people = data.handles.filter((h) => h.visibility !== 'private' || true)
    const existing = new Set<string>(data.chats.map((c: any) => [c.a_handle, c.b_handle].sort().join('|')))
    return suggestPairs(people, data.signals, data.heys, existing, 24, data.wings ?? [], mults)
  }, [data, mults])

  async function pair(p: Pair) {
    const key = p.a.handle + '|' + p.b.handle
    setBusy(key)
    const text = note[key] || draftIntro(p, spots?.[0]?.name)
    const { data: chatId } = await authClient()!.rpc('val_pair', { p_a: p.a.handle, p_b: p.b.handle, p_note: text })
    if (chatId) notify(authClient(), { kind: 'chat', id: chatId })
    setBusy(null); load()
  }

  async function valIntro(p: Pair) {
    const key = p.a.handle + '|' + p.b.handle
    setThinking(key)
    const r = await askVal(authClient()!, { kind: 'intro', a: p.a, b: p.b, reasons: p.reasons, flags: p.flags, spot: spots?.[0]?.name ?? '' })
    if (typeof r.text === 'string' && r.text) setNote({ ...note, [key]: r.text })
    else setNote({ ...note, [key]: draftIntro(p, spots?.[0]?.name) + '\n\n(Val\u2019s AI voice needs ANTHROPIC_API_KEY set on the edge function; this is her template.)' })
    setThinking(null)
  }

  async function valRead(h: Person) {
    setThinking(h.handle)
    const r = await askVal(authClient()!, { kind: 'read', person: h })
    setReads({ ...reads, [h.handle]: typeof r.text === 'string' && r.text ? r.text : 'Val needs her key for this. (ANTHROPIC_API_KEY on the edge function.)' })
    setThinking(null)
  }

  async function setStatus(id: string, status: string) {
    await authClient()!.rpc('set_application_status', { p_id: id, p_status: status }); load()
  }

  if (loading || data === undefined) return <AppShell title="Val's console"><p>One sec…</p></AppShell>
  if (!email) return <AppShell title="Val's console"><NeedLogin /></AppShell>
  if (data === null) return <AppShell title="Val's console"><h1 className="font-display font-extrabold text-4xl">Val only.</h1><p className="mt-2 text-[#141414]/60">This email isn&rsquo;t on the list.</p></AppShell>

  const pending = data.heys.filter((h: any) => h.status === 'sent' || h.status === 'previewed')
  // Tonight: who scanned in during the last six hours, by /spot, and Val's picks among them.
  const sixHoursAgo = Date.now() - 6 * 3600 * 1000
  const tonight = data.signals.filter((s: any) => s.kind === 'checkin' && new Date(s.created_at).getTime() > sixHoursAgo)
  const rooms: Record<string, Set<string>> = {}
  for (const s of tonight) { (rooms[s.venue_slug] ??= new Set()).add(s.email) }
  const existingPairs = new Set<string>(data.chats.map((c: any) => [c.a_handle, c.b_handle].sort().join('|')))
  const roomPairs = Object.fromEntries(Object.entries(rooms).map(([slug, emails]) => [
    slug, suggestPairs(data.handles.filter((h) => emails.has(h.email)), data.signals, data.heys, existingPairs, 10, data.wings ?? [], mults),
  ]))
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
                    <span className="font-display font-extrabold text-2xl tracking-tight">/{p.a.handle} <TagLine tags={p.a.tags} tag={p.a.tag} /></span>
                    <span className="text-[#141414]/40">+</span>
                    <span className="font-display font-extrabold text-2xl tracking-tight">/{p.b.handle} <TagLine tags={p.b.tags} tag={p.b.tag} /></span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[#141414]/10 max-w-xs"><div className="h-full rounded-full bg-ob" style={{ width: `${p.score}%` }} /></div>
                  <ul className="mt-3 text-sm grid gap-0.5">
                    {p.reasons.map((r) => <li key={r}>&#10003; {r}</li>)}
                    {p.flags.map((f) => <li key={f} className="text-ob">&#9888; {f}</li>)}
                  </ul>
                  <textarea value={note[key] ?? draftIntro(p, spots?.[0]?.name)} onChange={(e) => setNote({ ...note, [key]: e.target.value })} rows={3}
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

      {tab === 'Tonight' && (
        <div className="mt-6 grid gap-6">
          {Object.keys(rooms).length === 0 && <p className="text-sm">Nobody scanned in anywhere in the last six hours.</p>}
          {Object.entries(rooms).map(([slug, emails]) => (
            <div key={slug} className="border-2 border-[#141414] rounded-2xl p-5">
              <div className="flex items-baseline justify-between gap-4">
                <div className="font-display font-extrabold text-2xl">{spots?.find((v) => v.slug === slug)?.name ?? slug}</div>
                <div className="font-display font-extrabold text-4xl tabular-nums text-ob">{emails.size}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from(emails).map((e) => { const h = data.handles.find((x) => x.email === e); return <span key={e} className="text-sm font-semibold border border-[#141414]/15 rounded-full px-3 py-1">/{h?.handle ?? e} {h?.tag && <span className="text-ob">/{h.tag}</span>}</span> })}
              </div>
              <div className="mt-4 text-xs tracking-[0.15em] uppercase text-[#141414]/50">Val&rsquo;s picks in this room</div>
              {(roomPairs[slug] ?? []).length === 0 && <p className="text-sm mt-1">Nothing yet. Needs two people who fit.</p>}
              {(roomPairs[slug] ?? []).map((p) => {
                const key = p.a.handle + '|' + p.b.handle
                return (
                  <div key={key} className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#141414]/10 pt-3">
                    <span className="font-display font-extrabold text-lg">/{p.a.handle} + /{p.b.handle}</span>
                    <span className="text-sm text-[#141414]/60">{p.reasons.slice(0, 2).join(' ')}</span>
                    <span className="ml-auto font-display font-extrabold text-2xl tabular-nums">{p.score}</span>
                    <Pill primary onClick={() => pair(p)} disabled={busy === key}>{busy === key ? 'Pairing\u2026' : 'Introduce'}</Pill>
                  </div>
                )
              })}
              <div className="mt-4 text-xs text-[#141414]/50">&ldquo;I noticed someone&rdquo; notes from tonight are under Signals.</div>
            </div>
          ))}
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
                <span className="font-display font-extrabold text-xl">/{h.handle} <TagLine tags={h.tags} tag={h.tag} /></span>
                <span className="text-sm font-semibold">{h.name}{h.age ? `, ${h.age}` : ''}{h.hood ? ` · ${h.hood}` : ''}</span>
                {h.founding && <span className="text-xs font-extrabold text-ob">#{String(h.founding).padStart(3, '0')}</span>}
                {(h.strikes ?? 0) > 0 && <span className={`text-xs font-extrabold uppercase tracking-[0.12em] rounded-full px-2.5 py-0.5 ${h.benched ? 'bg-ob text-white' : 'bg-[#141414]/8'}`}>{h.benched ? 'Benched' : `${h.strikes} strike`}</span>}
                <span className="ml-auto text-xs uppercase tracking-[0.15em] text-[#141414]/50">{h.app_status ?? 'no /vibe'} &middot; {h.visibility}</span>
              </summary>
              <div className="mt-4 text-sm grid gap-2">
                <div className="text-[#141414]/60">{h.email} &middot; {h.identity ?? '?'} seeking {h.seeking ?? '?'}</div>
                {h.benched && (
                  <div className="flex flex-wrap items-center gap-3 bg-ob/5 rounded-xl p-3">
                    <span className="font-semibold">Two no-shows. Out of the pool, /name private.</span>
                    <Pill onClick={async () => { await authClient()!.rpc('unbench', { p_handle: h.handle }); load() }}>Lift the bench</Pill>
                  </div>
                )}
                {reads[h.handle] ? (
                  <div className="bg-[#FFF3EA] rounded-xl p-3 text-base">{reads[h.handle]}</div>
                ) : (
                  <button onClick={() => valRead(h)} disabled={thinking === h.handle} className="self-start text-xs font-extrabold text-ob underline underline-offset-4">
                    {thinking === h.handle ? 'Val\u2019s reading\u2026' : 'Val\u2019s read'}
                  </button>
                )}
                {h.answers && QUESTIONS.filter((q) => h.answers?.[q.id]).map((q) => (
                  <div key={q.id}><span className="text-[#141414]/50">{q.prompt}</span> &mdash; {h.answers![q.id]}</div>
                ))}
                {h.app_id && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Pill onClick={async () => { await authClient()!.rpc('set_verified', { p_app: h.app_id, p_verified: !h.verified }); load() }}>{h.verified ? 'Verified \u2713 (undo)' : 'Mark verified'}</Pill>
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
              {c.spot_slug && <span className="text-sm">{(spots?.find((v) => v.slug === c.spot_slug)?.name ?? 'their own pick')} &middot; {c.date_at && new Date(c.date_at).toLocaleString()}</span>}
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
              <span>{spots?.find((v) => v.slug === s.venue_slug)?.name ?? s.venue_slug}</span>
              <span className="text-[#141414]/60">{data.handles.find((h) => h.email === s.email)?.handle ? '/' + data.handles.find((h) => h.email === s.email)!.handle : s.email}</span>
              {s.note && <span className="italic">&ldquo;{s.note}&rdquo;</span>}
              <span className="ml-auto text-xs text-[#141414]/50">{new Date(s.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'System' && <System email={email} />}
      {tab === 'Funnel' && <FunnelTab />}
      {tab === 'Spots' && <SpotsTab />}
      {tab === 'Approve' && <ApproveTab apps={data.applications} handles={data.handles} onDone={load} />}
      {tab === 'Health' && <HealthTab />}
      {tab === 'Learning' && <LearningTab />}

      {tab === 'Reports' && <div className="mt-6"><ValFlags /></div>}
      {tab === 'Reports' && (
        <div className="mt-6 grid gap-2">
          {(data.reports ?? []).length === 0 && <p className="text-sm">No reports. Good.</p>}
          {(data.reports ?? []).map((r: any) => {
            const who = data.handles.find((h: any) => h.handle === r.about_handle) as any
            const act = async (a: string) => { await authClient()!.rpc('review_report', { p_report: r.id, p_action: a }); load() }
            return (
              <div key={r.id} className={`border-2 rounded-2xl p-4 text-sm grid gap-1 ${r.status === 'open' ? 'border-ob' : 'border-[#141414]/10 opacity-70'}`}>
                <div className="flex flex-wrap gap-3 items-baseline">
                  <span className="font-display font-extrabold text-xl">/{r.about_handle ?? 'deleted'}</span>
                  <span className="uppercase text-xs tracking-[0.15em] font-extrabold text-ob">{r.reason}</span>
                  {who?.suspended && <span className="text-xs font-extrabold uppercase tracking-[0.12em] bg-ob text-white rounded-full px-2.5 py-0.5">Removed</span>}
                  {r.auto_suspended && <span className="text-xs font-extrabold uppercase tracking-[0.12em] bg-[#141414] text-white rounded-full px-2.5 py-0.5">Auto</span>}
                  <span className="text-xs uppercase tracking-[0.12em] text-[#141414]/50">{r.status}</span>
                  <span className="ml-auto text-xs text-[#141414]/50">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <div className="text-[#141414]/60">from {r.reporter_email}{r.chat_id ? ' \u00b7 from a /chat' : ''}</div>
                {r.details && <div>{r.details}</div>}
                {r.status === 'open' && r.about_handle && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!who?.suspended && <Pill primary onClick={() => act('suspend')}>Remove from pool</Pill>}
                    {who?.suspended && <Pill onClick={() => act('lift')}>Lift, they&rsquo;re fine</Pill>}
                    <Pill onClick={() => act('ban')}>Ban for good</Pill>
                    <Pill onClick={() => act('dismiss')}>Dismiss</Pill>
                  </div>
                )}
              </div>
            )
          })}
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
