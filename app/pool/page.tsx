'use client'

// Your pool. Val's picks on top, then everyone who'd want you back, closest
// first. Scroll, filter by vibe, send a /hey or send a vibe. No swiping.
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AppShell, NeedLogin } from '../ui'
import { authClient, useSession } from '@/lib/auth'
import { notify } from '@/lib/val'
import { TAGS, cleanVibe } from '@/lib/handles'
import { rank, usePool, usePhotoUrls, type Ranked } from '@/lib/pool'
import { TagLine, VibeInput } from '../tags'
import { ShareButton } from '../share'

const SHOW = ['saturday', 'looking_for', 'life_stage'] as const
const ASK: Record<string, string> = { saturday: 'Saturday', looking_for: 'Looking for', life_stage: 'Right now' }

export default function PoolPage() {
  const { email, loading } = useSession()
  const { pool, reload } = usePool()
  const [filter, setFilter] = useState<string | null>(null)

  const ranked = useMemo(() => (pool ? rank(pool) : []), [pool])
  const picks = useMemo(() => (pool?.picks ?? []).map((p) => ({ ...p, person: ranked.find((r) => r.handle === p.handle) })).filter((p) => p.person), [pool, ranked])
  const pickSet = new Set(picks.map((p) => p.handle))
  const myLead = pool?.me?.tags?.[0] ?? null

  // Vibe filters: yours first, then what the pool is feeling.
  const vibes = useMemo(() => {
    const count = new Map<string, number>()
    for (const r of ranked) for (const t of r.tags ?? []) count.set(t, (count.get(t) ?? 0) + 1)
    const list = Array.from(count.entries()).sort((a, b) => b[1] - a[1]).map(([t]) => t)
    return myLead ? [myLead, ...list.filter((t) => t !== myLead)].slice(0, 12) : list.slice(0, 12)
  }, [ranked, myLead])
  const shown = ranked.filter((r) => !pickSet.has(r.handle) && (!filter || (r.tags ?? []).includes(filter)))
  const keys = useMemo(() => [...picks.map((p) => p.person!), ...shown].flatMap((r) => r.photos.slice(0, 1)), [picks, shown])
  const urls = usePhotoUrls(keys)

  if (loading || !pool) return <AppShell title="Your pool"><p className="text-sm">Looking…</p></AppShell>
  if (!email || pool.state === 'login') return <AppShell title="Your pool"><NeedLogin /></AppShell>
  if (pool.state !== 'open') return <AppShell title="Your pool"><NotYet state={pool.state} /></AppShell>

  return (
    <AppShell title="Your pool">
      <VibeNow lead={myLead} handle={pool.me?.handle ?? null} onChange={reload} />

      {picks.length > 0 && (
        <section className="mt-10">
          <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">Val&rsquo;s picks for you</div>
          <p className="mt-1 text-sm text-[#141414]/60">Your matchmaker picked these three. She&rsquo;ll keep an eye out for more.</p>
          <div className="mt-3 grid sm:grid-cols-3 gap-3">
            {picks.map((p) => <Card key={p.handle} r={p.person!} url={urls[p.person!.photos[0]]} pick why={p.reason} onSent={reload} />)}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-extrabold text-3xl tracking-tight">Everyone in your pool</h2>
          <span className="text-sm text-[#141414]/50 tabular-nums">{ranked.length}</span>
        </div>
        <p className="mt-1 text-sm text-[#141414]/60">People who&rsquo;d want you back. Closest first.</p>

        {vibes.length > 0 && (
          <div className="mt-4 -mx-5 px-5 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto pb-1">
            <Chip on={!filter} onClick={() => setFilter(null)}>Everyone</Chip>
            {vibes.map((v) => (
              <Chip key={v} on={filter === v} onClick={() => setFilter(filter === v ? null : v)}>
                {v === myLead ? `Feeling /${v} too` : `/${v}`}
              </Chip>
            ))}
          </div>
        )}

        {ranked.length === 0 ? (
          <p className="mt-8 text-base text-[#141414]/70 max-w-md">Nobody in your pool yet. Charleston&rsquo;s filling in; Val will tell you the moment someone who fits joins.</p>
        ) : shown.length === 0 ? (
          <p className="mt-8 text-base text-[#141414]/70">Nobody&rsquo;s feeling /{filter} right now. Try another vibe.</p>
        ) : (
          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shown.map((r) => <Card key={r.handle} r={r} url={urls[r.photos[0]]} onSent={reload} />)}
          </div>
        )}
      </section>
    </AppShell>
  )
}

function NotYet({ state }: { state: string }) {
  const [head, line, href, cta] =
    state === 'no_name' ? ['First, a /name.', 'Thirty seconds. It’s what you give out instead of your number.', '/claim/', 'Claim my /name'] :
    state === 'no_vibe' ? ['Your /vibe opens your pool.', 'Eight questions, your photos, sixty seconds of your voice. It’s how Val finds your people.', '/apply/', 'Get my /vibe'] :
    state === 'pending' ? ['Val’s reading your /vibe.', 'Your pool opens the moment you’re approved, with Val’s first three picks on top.', '/me/', 'Back to /me'] :
    ['Not this season.', 'Thanks for trusting Val with your /vibe.', '/', 'Home']
  return (
    <div className="max-w-md">
      <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em] leading-[0.95]">{head}</h1>
      <p className="mt-4 text-lg text-[#141414]/65">{line}</p>
      <Link href={href} className="inline-block mt-6 bg-ob text-white rounded-full px-8 py-4 font-extrabold">{cta}</Link>
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`shrink-0 rounded-full px-4 py-2 text-sm font-extrabold whitespace-nowrap ${on ? 'bg-[#141414] text-white' : 'border-2 border-[#141414]/15'}`}>
      {children}
    </button>
  )
}

// Your vibe right now. One tap to change it; it stays until you change it again.
function VibeNow({ lead, handle, onChange }: { lead: string | null; handle: string | null; onChange: () => void }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  async function set(v: string) {
    setBusy(true)
    await authClient()!.rpc('set_vibe_now', { p_vibe: cleanVibe(v) })
    setBusy(false); setOpen(false); onChange()
  }
  return (
    <section className="rounded-[28px] bg-[#141414] text-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs tracking-[0.2em] uppercase font-semibold text-white/50">Your vibe right now</div>
          <div className="mt-1 font-display font-extrabold text-4xl tracking-tight text-ob">/{lead ?? '…'}</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <button onClick={() => setOpen(!open)} className="rounded-full border-2 border-white px-5 py-2.5 text-sm font-extrabold">{open ? 'Done' : 'Change it'}</button>
          {lead && <ShareButton vibe={lead} handle={handle} className="rounded-full bg-ob text-white px-5 py-2.5 text-sm font-extrabold" />}
        </div>
      </div>
      {open && (
        <div className="mt-4 grid gap-3">
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button key={t.value} disabled={busy} onClick={() => set(t.value)}
                className={`rounded-full px-4 py-2 text-sm font-extrabold ${t.value === lead ? 'bg-ob text-white' : 'bg-white/10'}`}>/{t.value}</button>
            ))}
          </div>
          <div className="bg-white rounded-3xl p-2 text-[#141414]"><VibeInput onAdd={set} disabled={busy} placeholder="or make your own" /></div>
        </div>
      )}
    </section>
  )
}

function Card({ r, url, pick, why, onSent }: { r: Ranked; url?: string; pick?: boolean; why?: string | null; onSent: () => void }) {
  const { email } = useSession()
  const [more, setMore] = useState(false)
  const [send, setSend] = useState(false)
  const [vibe, setVibe] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | string>(r.i_sent ? 'sent' : 'idle')
  const [voice, setVoice] = useState<string | null>(null)
  const extra = usePhotoUrls(more ? r.photos.slice(1) : [])

  async function go() {
    setState('sending')
    const c = authClient()!
    const { data } = vibe
      ? await c.rpc('send_vibe', { p_to: r.handle, p_vibe: vibe, p_note: note || null })
      : await c.rpc('send_hey', { p_to: r.handle, p_note: note || null })
    if (data === 'ok' || data === 'dupe') {
      setState('sent'); setSend(false)
      if (data === 'ok') notify(c, { kind: 'hey', to_handle: r.handle, from_email: email })
      onSent()
    } else setState(data === 'limit' ? 'That’s a lot for one day. Try tomorrow.' : data === 'not_approved' ? 'You can send once Val approves your /vibe.' : data === 'bad_vibe' ? 'That vibe isn’t allowed.' : 'Couldn’t send. Try again.')
  }
  async function playVoice() {
    if (!r.voice_key || voice) return
    const { data } = await authClient()!.storage.from('date-intake').createSignedUrl(r.voice_key, 3600)
    if (data?.signedUrl) setVoice(data.signedUrl)
  }
  const suggestions = Array.from(new Set([...(r.tags ?? []), 'drinks', 'tacos', 'coffee', 'walk']))

  return (
    <article className={`rounded-3xl overflow-hidden bg-white border-2 ${pick ? 'border-ob' : 'border-[#141414]/10'}`}>
      <button onClick={() => setMore(!more)} className="block w-full text-left">
        <div className="relative aspect-[4/5] bg-[#141414]">
          {url
            ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt={r.name} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0 grid place-items-center font-display font-extrabold text-8xl text-white/15">{r.name.slice(0, 1)}</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
          {pick && <span className="absolute top-3 left-3 bg-ob text-white text-[11px] font-extrabold uppercase tracking-[0.12em] rounded-full px-3 py-1">Val&rsquo;s pick</span>}
          {r.sent_me && <span className="absolute top-3 right-3 bg-white text-[#141414] text-[11px] font-extrabold uppercase tracking-[0.12em] rounded-full px-3 py-1">Sent you one</span>}
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <div className="font-display font-extrabold text-3xl leading-none tracking-tight">/{r.handle}</div>
            <div className="mt-1 font-display font-extrabold text-xl"><TagLine tags={r.tags} /></div>
            <div className="mt-1 text-sm font-semibold text-white/85">{r.name}{r.age ? `, ${r.age}` : ''}{r.hood ? ` · ${r.hood}` : ''}{r.verified ? ' · Verified' : ''}</div>
          </div>
        </div>
      </button>

      <div className="p-4">
        {(why ?? r.why) && <p className="text-sm text-[#141414]/75"><span className="font-extrabold text-ob">Val:</span> {why ?? r.why}</p>}

        {more && (
          <div className="mt-3 grid gap-3">
            {r.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {r.photos.slice(1).map((k) => extra[k] && /* eslint-disable-next-line @next/next/no-img-element */ <img key={k} src={extra[k]} alt="" className="h-28 aspect-[4/5] object-cover rounded-xl" />)}
              </div>
            )}
            <dl className="grid gap-2 text-sm">
              {SHOW.map((k) => r.answers?.[k] ? <div key={k}><dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#141414]/45">{ASK[k]}</dt><dd>{r.answers[k]}</dd></div> : null)}
            </dl>
            {r.voice_key && (voice
              ? <audio src={voice} controls autoPlay className="w-full" />
              : <button onClick={playVoice} className="justify-self-start rounded-full border-2 border-[#141414] px-4 py-2 text-sm font-extrabold">Hear their voice</button>)}
          </div>
        )}

        {state === 'sent' ? (
          <p className="mt-3 text-sm font-extrabold text-ob">Sent. They&rsquo;ll see it in their inbox.</p>
        ) : !send ? (
          <div className="mt-3 flex gap-2">
            <button onClick={() => { setSend(true); setVibe(null) }} className="flex-1 bg-ob text-white rounded-full px-4 py-3 text-sm font-extrabold">Send a /hey</button>
            <button onClick={() => { setSend(true); setVibe(r.tags?.[0] ?? 'drinks') }} className="flex-1 border-2 border-[#141414] rounded-full px-4 py-3 text-sm font-extrabold">Send a vibe</button>
          </div>
        ) : (
          <div className="mt-3 grid gap-2">
            {vibe !== null && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => setVibe(s)} className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${vibe === s ? 'bg-ob text-white' : 'bg-[#141414]/[0.06]'}`}>/{s}</button>
                  ))}
                </div>
                <VibeInput onAdd={setVibe} placeholder="or your own" />
              </>
            )}
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} placeholder="Add a line (optional)"
              className="border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-4 py-2.5 text-base" />
            <div className="flex gap-2">
              <button onClick={go} disabled={state === 'sending'} className="flex-1 bg-ob text-white rounded-full px-4 py-3 text-sm font-extrabold disabled:opacity-50">
                {state === 'sending' ? 'Sending…' : vibe ? `Send /${vibe}` : 'Send /hey'}
              </button>
              <button onClick={() => setSend(false)} className="rounded-full px-4 py-3 text-sm font-semibold">Cancel</button>
            </div>
            {state !== 'idle' && state !== 'sending' && <p className="text-sm font-semibold text-ob">{state}</p>}
          </div>
        )}
      </div>
    </article>
  )
}
