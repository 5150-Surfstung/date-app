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
  lat: number | null; lng: number | null; pin_source: 'address' | 'crowd' | 'val' | null; pin_flag: string | null
  pin_suggest: { lat: number; lng: number } | null; door_key: string
  about: string | null; hours: string | null; phone: string | null; instagram: string | null; tiktok: string | null; photo: string | null
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

              <PinTools spot={s} onSaved={load} />
              {s.status === 'approved' && <LiveTools spot={s} onSaved={load} />}
            </div>
          ))}
        </div>
      </section>

      <Sponsored spots={spots.filter((s) => s.status === 'approved')} />
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

// Val finds each pin from the address, and window-QR check-ins correct it.
// Val's people only step in when it's flagged.
const PIN_FROM = { address: 'found from the address', crowd: 'learned from check-ins at the door', val: 'set by you' } as const

/** "32.78, -79.93" or any Google Maps link with coordinates in it. */
function parsePin(t: string): { lat: number; lng: number } | null {
  const m = t.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ?? t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ?? t.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/)
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null
}

function PinTools({ spot, onSaved }: { spot: Spot; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  async function pin(p: { lat: number; lng: number } | null) {
    if (!p) { setMsg('Paste coordinates like 32.7765, -79.9311, or a Google Maps link.'); return }
    await authClient()!.rpc('val_pin_spot', { p_slug: spot.slug, p_lat: p.lat, p_lng: p.lng })
    setOpen(false); setText(''); setMsg(null); onSaved()
  }
  async function findAgain() {
    await authClient()!.rpc('val_find_pin', { p_slug: spot.slug })
    setMsg('Looking it up. Refresh in a few seconds.')
    setTimeout(onSaved, 4000)
  }
  const map = spot.lat != null ? `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}` : null
  return (
    <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${spot.pin_flag ? 'bg-ob/10 border-2 border-ob' : 'bg-[#141414]/[0.04]'}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-extrabold">Pin</span>
        {map ? <a className="underline" target="_blank" rel="noreferrer" href={map}>{spot.lat!.toFixed(5)}, {spot.lng!.toFixed(5)}</a> : <span>none yet</span>}
        {spot.pin_source && <span className="text-[#141414]/55">{PIN_FROM[spot.pin_source]}</span>}
        <span className="ml-auto flex gap-3 font-semibold">
          <button className="underline" onClick={() => setOpen(!open)}>Set it</button>
          <button className="underline" onClick={findAgain}>Find it again</button>
        </span>
      </div>
      {spot.pin_flag && <p className="mt-1 font-semibold text-ob">{spot.pin_flag}</p>}
      {spot.pin_suggest && (
        <button className="mt-1 underline font-semibold" onClick={() => pin(spot.pin_suggest)}>Move it to where people actually check in</button>
      )}
      {open && (
        <div className="mt-2 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste from Google Maps (long-press the spot)"
            className="flex-1 border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-4 py-2 text-sm bg-white" />
          <Pill onClick={() => pin(parsePin(text))}>Save</Pill>
        </div>
      )}
      {msg && <p className="mt-1 text-[#141414]/60">{msg}</p>}
    </div>
  )
}

type Card = Pick<Spot, 'perk' | 'about' | 'hours' | 'phone' | 'website' | 'instagram' | 'tiktok' | 'address' | 'night_when' | 'night_detail'>
const CARD_FIELDS: [keyof Card, string][] = [
  ['about', 'One line about them (shows on their card)'], ['hours', 'Hours, e.g. Daily 4pm–2am'], ['address', 'Address'],
  ['phone', 'Public phone'], ['website', 'Website'], ['instagram', 'Instagram @'], ['tiktok', 'TikTok @'],
  ['perk', 'What introduced couples get'],
]

// A live spot: their card, the window QR, and the next /night.
function LiveTools({ spot, onSaved }: { spot: Spot; onSaved: () => void }) {
  const [f, setF] = useState<Card>(() => Object.fromEntries(
    ([...CARD_FIELDS.map(([k]) => k), 'night_when', 'night_detail'] as (keyof Card)[]).map((k) => [k, spot[k] ?? '']),
  ) as Card)
  const [saved, setSaved] = useState(false)
  const [upload, setUpload] = useState<string | null>(null)
  const set = (k: keyof Card) => (e: React.ChangeEvent<HTMLInputElement>) => { setF({ ...f, [k]: e.target.value }); setSaved(false) }
  async function save() {
    await authClient()!.rpc('val_update_spot', { p_slug: spot.slug, p: f })
    setSaved(true); onSaved()
  }
  async function photo(file: File | undefined) {
    if (!file) return
    setUpload('Uploading…')
    const key = `${spot.slug}/${Date.now()}.${(file.name.split('.').pop() || 'jpg').toLowerCase()}`
    const { error } = await authClient()!.storage.from('date-spots').upload(key, file, { contentType: file.type, upsert: false })
    if (error) { setUpload('Upload failed.'); return }
    await authClient()!.rpc('val_update_spot', { p_slug: spot.slug, p: { photo: key } })
    setUpload('Cover photo set.'); onSaved()
  }
  async function newKey() {
    if (!confirm('Make a new window QR? The old one stops checking people in. Only do this if a QR leaked or got copied.')) return
    await authClient()!.rpc('val_new_door_key', { p_slug: spot.slug }); onSaved()
  }
  const kit = `/spot/${spot.slug}/kit/?k=${spot.door_key}`
  const field = 'border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-4 py-2.5 text-sm'
  return (
    <div className="mt-5 border-t border-[#141414]/10 pt-4 grid gap-3">
      <div className="flex flex-wrap gap-3 text-sm font-semibold">
        <a className="underline" target="_blank" href={`/spot/${spot.slug}/`}>Their card</a>
        <a className="underline" target="_blank" href={kit}>Their window QR</a>
        <button className="underline" onClick={() => navigator.clipboard?.writeText(`${site()}${kit}`)}>Copy QR link</button>
        <button className="underline text-[#141414]/50" onClick={newKey}>New QR key</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {CARD_FIELDS.map(([k, ph]) => <input key={k} value={f[k] ?? ''} onChange={set(k)} placeholder={ph} className={field} />)}
      </div>
      <label className="text-sm font-semibold flex flex-wrap items-center gap-3">
        <span className="underline cursor-pointer">{spot.photo ? 'Change cover photo' : 'Add a cover photo'}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => photo(e.target.files?.[0])} />
        {upload && <span className="text-[#141414]/60 font-normal">{upload}</span>}
      </label>
      <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-2">
        <input value={f.night_when ?? ''} onChange={set('night_when')} placeholder="Next /night, e.g. Thu, Nov 6 · 7pm" className={field} />
        <input value={f.night_detail ?? ''} onChange={set('night_detail')} placeholder="One line about it" className={field} />
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

// Sponsored vibes: a venue owns a word for a night or a week. It sits on top of
// /trending (marked Sponsored) and first in everyone's vibe suggestions.
// Take payment however you do; this just switches it on and off.
type Sponsor = { id: number; vibe: string; label: string | null; spot_slug: string | null; starts_at: string; ends_at: string }
function Sponsored({ spots }: { spots: Spot[] }) {
  const [list, setList] = useState<Sponsor[]>([])
  const [vibe, setVibe] = useState('')
  const [label, setLabel] = useState('')
  const [spot, setSpot] = useState('')
  const [days, setDays] = useState('1')
  const [err, setErr] = useState<string | null>(null)
  const load = () => authClient()!.rpc('val_sponsors').then(({ data }) => setList((data as Sponsor[]) ?? []))
  useEffect(() => { load() }, [])
  async function add() {
    setErr(null)
    const ends = new Date(Date.now() + Number(days) * 864e5).toISOString()
    const { data } = await authClient()!.rpc('val_save_sponsor', { p_vibe: vibe, p_label: label || null, p_spot: spot || null, p_starts: null, p_ends: ends })
    if (data === 'ok') { setVibe(''); setLabel(''); load() } else setErr(data === 'bad_vibe' ? 'That word isn’t allowed.' : 'Couldn’t save.')
  }
  async function end(id: number) { await authClient()!.rpc('val_end_sponsor', { p_id: id }); load() }
  const live = list.filter((s) => new Date(s.ends_at).getTime() > Date.now())
  return (
    <section>
      <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">Sponsored vibes</div>
      <p className="mt-2 text-sm text-[#141414]/60 max-w-xl">Sell a venue its word, like /tacotuesday. It goes on top of /trending, marked Sponsored, and first in everyone&rsquo;s vibe suggestions until it ends.</p>
      <div className="mt-4 grid gap-2">
        {live.map((s) => (
          <div key={s.id} className="rounded-2xl border-2 border-ob p-4 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-display font-extrabold text-2xl">/{s.vibe}</span>
            <span className="text-sm">{s.label}</span>
            <span className="text-xs text-[#141414]/50">until {new Date(s.ends_at).toLocaleString()}</span>
            <button onClick={() => end(s.id)} className="ml-auto text-sm font-semibold underline">End now</button>
          </div>
        ))}
      </div>
      <div className="mt-3 grid sm:grid-cols-[1fr_2fr_1fr_auto_auto] gap-2">
        <input value={vibe} onChange={(e) => setVibe(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} placeholder="tacotuesday" className="border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-4 py-2.5 text-sm" />
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="$2 tacos for /date members, 6–9" className="border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-4 py-2.5 text-sm" />
        <select value={spot} onChange={(e) => setSpot(e.target.value)} className="border-2 border-[#141414]/15 rounded-full px-4 py-2.5 text-sm bg-white">
          <option value="">No spot</option>
          {spots.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
        <select value={days} onChange={(e) => setDays(e.target.value)} className="border-2 border-[#141414]/15 rounded-full px-4 py-2.5 text-sm bg-white">
          <option value="1">1 day</option><option value="3">3 days</option><option value="7">1 week</option><option value="30">30 days</option>
        </select>
        <Pill primary onClick={add} disabled={!vibe}>Go live</Pill>
      </div>
      {err && <p className="mt-2 text-sm text-ob">{err}</p>}
    </section>
  )
}
