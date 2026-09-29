'use client'

// Every /spot goes through Val's people. Nothing is public until approved.
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth'
import { SPOT_KINDS } from '@/lib/venues'
import { Pill } from '../ui'

type Spot = {
  slug: string; name: string; status: 'pending' | 'approved' | 'declined' | 'paused'; kind: string | null
  area: string | null; address: string | null; website: string | null; perk: string | null; pitch: string | null
  contact_name: string | null; contact_role: string | null; contact_email: string | null; contact_phone: string | null
  night_ok: boolean; rep_code: string | null; rep_name: string | null; review_note: string | null
  night_when: string | null; night_detail: string | null; created_at: string; reviewed_at: string | null; checkins: number
}
type Rep = { code: string; name: string; email: string | null; active: boolean; sent: number; approved: number }

const kindLabel = (k: string | null) => SPOT_KINDS.find(([v]) => v === k)?.[1] ?? 'Other'
const site = () => (typeof window !== 'undefined' ? window.location.origin : '')

export function SpotsTab() {
  const [spots, setSpots] = useState<Spot[] | null | undefined>(undefined)
  const [reps, setReps] = useState<Rep[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending')
  const [note, setNote] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    const c = authClient()!
    const [{ data: s }, { data: r }] = await Promise.all([c.rpc('val_spots'), c.rpc('val_reps')])
    setSpots(s as Spot[] | null)
    setReps((r as Rep[]) ?? [])
  }
  useEffect(() => { load() }, [])

  async function review(slug: string, action: 'approve' | 'decline' | 'pause' | 'unpause') {
    setBusy(slug + action)
    await authClient()!.rpc('val_review_spot', { p_slug: slug, p_action: action, p_note: note[slug] ?? null })
    setBusy(null); load()
  }

  if (spots === undefined) return <p className="mt-6 text-sm">Loading spots…</p>
  if (!spots) return <p className="mt-6 text-sm">Val only.</p>
  const pending = spots.filter((s) => s.status === 'pending')
  const shown = filter === 'all' ? spots : spots.filter((s) => s.status === filter)

  return (
    <div className="mt-6 grid gap-10 max-w-4xl">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          {(['pending', 'approved', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-extrabold ${filter === f ? 'bg-[#141414] text-white' : 'border-2 border-[#141414]/15'}`}>
              {f === 'pending' ? `Waiting on you (${pending.length})` : f === 'approved' ? 'Live' : 'Everything'}
            </button>
          ))}
          <a href="/partner/" target="_blank" className="ml-auto text-sm font-semibold underline">The venue sign-up page &rarr;</a>
        </div>

        {shown.length === 0 && <p className="mt-6 text-sm">{filter === 'pending' ? 'Nothing waiting. Send a rep out.' : 'None yet.'}</p>}
        <div className="mt-5 grid gap-4">
          {shown.map((s) => (
            <div key={s.slug} className={`rounded-2xl border-2 p-5 ${s.status === 'pending' ? 'border-ob' : 'border-[#141414]/10'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <div className="font-display font-extrabold text-2xl tracking-tight">{s.name}</div>
                  <div className="text-sm text-[#141414]/60">{kindLabel(s.kind)}{s.area ? ` · ${s.area}` : ''} · applied {new Date(s.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`text-xs font-extrabold uppercase tracking-[0.12em] rounded-full px-3 py-1 ${
                  s.status === 'approved' ? 'bg-[#141414] text-white' : s.status === 'pending' ? 'bg-ob text-white' : 'bg-[#141414]/10'}`}>
                  {s.status === 'approved' ? 'Live' : s.status}
                </span>
              </div>

              <dl className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {s.address && <Row k="Address"><a className="underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/${encodeURIComponent(`${s.name} ${s.address}`)}`}>{s.address}</a></Row>}
                {s.website && <Row k="Web"><a className="underline break-all" target="_blank" rel="noreferrer" href={/^https?:/.test(s.website) ? s.website : `https://${s.website}`}>{s.website}</a></Row>}
                <Row k="Contact">{s.contact_name}{s.contact_role ? ` (${s.contact_role})` : ''}</Row>
                <Row k="Reach">{s.contact_email && <a className="underline" href={`mailto:${s.contact_email}`}>{s.contact_email}</a>}{s.contact_phone ? ` · ${s.contact_phone}` : ''}</Row>
                <Row k="Brought in by">{s.rep_name ? `${s.rep_name} (${s.rep_code})` : 'Came in on its own'}</Row>
                <Row k="Would host a /night">{s.night_ok ? 'Yes' : 'Not yet'}</Row>
                {s.perk && <Row k="They'd offer" wide>{s.perk}</Row>}
                {s.pitch && <Row k="Why /date" wide>{s.pitch}</Row>}
                {s.status === 'approved' && <Row k="Check-ins so far">{s.checkins}</Row>}
              </dl>

              <a className="mt-3 inline-block text-sm font-semibold underline" target="_blank" rel="noreferrer"
                href={`https://www.google.com/search?q=${encodeURIComponent(`${s.name} ${s.area ?? 'Charleston'} reviews`)}`}>
                Vet it: reviews, photos, news &rarr;
              </a>

              <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                <input value={note[s.slug] ?? ''} onChange={(e) => setNote({ ...note, [s.slug]: e.target.value })}
                  placeholder="Optional note in the email to them"
                  className="flex-1 border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-4 py-2.5 text-sm" />
                <div className="flex flex-wrap gap-2">
                  {s.status !== 'approved' && <Pill primary onClick={() => review(s.slug, s.status === 'paused' ? 'unpause' : 'approve')} disabled={busy !== null}>{s.status === 'paused' ? 'Put back live' : 'Approve'}</Pill>}
                  {s.status === 'pending' && <Pill onClick={() => review(s.slug, 'decline')} disabled={busy !== null}>Decline</Pill>}
                  {s.status === 'approved' && <Pill onClick={() => review(s.slug, 'pause')} disabled={busy !== null}>Pause</Pill>}
                </div>
              </div>

              {s.status === 'approved' && <LiveTools spot={s} onSaved={load} />}
            </div>
          ))}
        </div>
      </section>

      <Reps reps={reps} onSaved={load} />
    </div>
  )
}

function Row({ k, children, wide }: { k: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#141414]/45">{k}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  )
}

// A live spot: links for the venue, and the next /night.
function LiveTools({ spot, onSaved }: { spot: Spot; onSaved: () => void }) {
  const [when, setWhen] = useState(spot.night_when ?? '')
  const [detail, setDetail] = useState(spot.night_detail ?? '')
  const [perk, setPerk] = useState(spot.perk ?? '')
  const [saved, setSaved] = useState(false)
  async function save() {
    await authClient()!.rpc('val_update_spot', { p_slug: spot.slug, p: { night_when: when, night_detail: detail, perk } })
    setSaved(true); onSaved()
  }
  return (
    <div className="mt-5 border-t border-[#141414]/10 pt-4 grid gap-3">
      <div className="flex flex-wrap gap-3 text-sm font-semibold">
        <a className="underline" target="_blank" href={`/spot/${spot.slug}/`}>Their page</a>
        <a className="underline" target="_blank" href={`/spot/${spot.slug}/kit/`}>Their QR kit (print)</a>
        <button className="underline" onClick={() => navigator.clipboard?.writeText(`${site()}/spot/${spot.slug}/kit/`)}>Copy kit link</button>
      </div>
      <input value={perk} onChange={(e) => { setPerk(e.target.value); setSaved(false) }} placeholder="What introduced couples get (shows on their page)"
        className="border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-4 py-2.5 text-sm" />
      <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-2">
        <input value={when} onChange={(e) => { setWhen(e.target.value); setSaved(false) }} placeholder="Next /night, e.g. Thu, Nov 6 · 7pm"
          className="border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-4 py-2.5 text-sm" />
        <input value={detail} onChange={(e) => { setDetail(e.target.value); setSaved(false) }} placeholder="One line about it"
          className="border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-4 py-2.5 text-sm" />
        <Pill onClick={save}>{saved ? 'Saved' : 'Save'}</Pill>
      </div>
    </div>
  )
}

// Sales reps: each gets a pitch page with their own QR and link.
function Reps({ reps, onSaved }: { reps: Rep[]; onSaved: () => void }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [err, setErr] = useState<string | null>(null)
  async function add() {
    setErr(null)
    const { data } = await authClient()!.rpc('val_save_rep', { p_code: code, p_name: name, p_email: email || null, p_active: true })
    if (data === 'ok') { setCode(''); setName(''); setEmail(''); onSaved() }
    else setErr(data === 'code' ? 'Code: 2–24 lowercase letters, numbers or dashes.' : data === 'name' ? 'Add their name.' : 'Couldn’t save.')
  }
  async function toggle(r: Rep) {
    await authClient()!.rpc('val_save_rep', { p_code: r.code, p_name: r.name, p_email: r.email, p_active: !r.active })
    onSaved()
  }
  return (
    <section>
      <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">Sales reps</div>
      <p className="mt-2 text-sm text-[#141414]/60 max-w-xl">Each rep gets a pitch page with their own QR code and link. Venues they bring in are tagged with their name, and still come to you for approval.</p>
      <div className="mt-4 grid gap-2">
        {reps.map((r) => (
          <div key={r.code} className={`rounded-2xl border-2 border-[#141414]/10 p-4 flex flex-wrap items-center gap-x-5 gap-y-2 ${r.active ? '' : 'opacity-50'}`}>
            <div className="font-extrabold">{r.name} <span className="text-[#141414]/45 font-semibold">· {r.code}</span></div>
            <div className="text-sm">{r.sent} sent · {r.approved} live</div>
            <a className="text-sm font-semibold underline" target="_blank" href={`/partner/rep/?c=${r.code}`}>Their pitch page + QR</a>
            <button className="text-sm font-semibold underline" onClick={() => navigator.clipboard?.writeText(`${site()}/partner/rep/?c=${r.code}`)}>Copy it</button>
            <button className="ml-auto text-sm font-semibold underline" onClick={() => toggle(r)}>{r.active ? 'Turn off' : 'Turn on'}</button>
          </div>
        ))}
      </div>
      <div className="mt-4 grid sm:grid-cols-[1fr_1fr_1.4fr_auto] gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rep name"
          className="border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-4 py-2.5 text-sm" />
        <input value={code} onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="code, e.g. mike"
          className="border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-4 py-2.5 text-sm" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" type="email"
          className="border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-4 py-2.5 text-sm" />
        <Pill primary onClick={add} disabled={!code || !name}>Add rep</Pill>
      </div>
      {err && <p className="mt-2 text-sm text-ob">{err}</p>}
    </section>
  )
}
