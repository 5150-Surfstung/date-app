'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AppShell, NeedLogin, Pill } from '../ui'
import { authClient, useSession } from '@/lib/auth'
import { VENUES } from '@/lib/venues'
import { getDemo, demoPhoto } from '@/lib/demo'
import { dareFor } from '@/lib/dares'
import { INTAKE_BUCKET } from '@/lib/supabase'
import { askVal } from '@/lib/val'

type Chat = {
  id: string; created_at: string; closes_at: string; status: 'open' | 'date_set' | 'closed'
  spot_slug: string | null; date_at: string | null; val_note: string | null; me: string
  brief: { for: string; sections: Record<string, string>; text: string } | null
  them: { handle: string; name: string; tag: string | null; email: string; age: number | null; hood: string | null; photo_key: string | null }
  my_count: number; their_count: number; debriefed: boolean
}
type Msg = { id: string; created_at: string; from_email: string; body: string }

const UNLOCK_AT = 3

export default function ChatClient() {
  const { email, loading } = useSession()
  const params = useSearchParams()
  const [chats, setChats] = useState<Chat[] | null>(null)
  const [active, setActive] = useState<string | null>(params.get('c'))

  async function load() {
    await authClient()!.rpc('close_expired_chats')
    const { data } = await authClient()!.rpc('my_chats')
    setChats((data as Chat[]) ?? [])
  }
  useEffect(() => { if (email) load() }, [email])

  if (loading) return <AppShell title="/chat"><p>One sec…</p></AppShell>
  if (!email) return <AppShell title="/chat"><NeedLogin /></AppShell>

  const chat = chats?.find((c) => c.id === active) ?? null

  return (
    <AppShell title="/chat">
      {!chat ? (
        <>
          <h1 className="font-display font-extrabold text-4xl tracking-tight">
            {chats === null ? '…' : chats.length === 0 ? 'Nothing open yet.' : `${chats.length} /chat${chats.length > 1 ? 's' : ''}.`}
          </h1>
          <p className="mt-2 text-base text-[#141414]/70 max-w-lg">
            Every /chat has forty-eight hours to become a /date. Pick a /spot and a time, or it closes. No hard feelings. &mdash; Val
          </p>
          <div className="mt-8 grid gap-3 max-w-2xl">
            {chats?.map((c) => (
              <button key={c.id} onClick={() => setActive(c.id)}
                className="text-left border-2 border-[#141414]/10 hover:border-ob rounded-2xl p-5 flex items-center justify-between gap-4 transition-colors">
                <div>
                  <div className="font-display font-extrabold text-2xl tracking-tight">/{c.them.handle} {c.them.tag && <span className="text-ob">/{c.them.tag}</span>}</div>
                  <div className="text-sm font-semibold mt-0.5">{c.them.name}{c.them.age ? `, ${c.them.age}` : ''}</div>
                </div>
                <Status c={c} />
              </button>
            ))}
          </div>
          {chats?.length === 0 && (
            <p className="mt-6 text-sm text-[#141414]/60">A /chat opens when you say yes to a /hey, or when Val pairs you. <Link href="/inbox/" className="underline">Check your inbox</Link>.</p>
          )}
        </>
      ) : (
        <Thread chat={chat} me={email} onBack={() => { setActive(null); load() }} onChange={load} />
      )}
    </AppShell>
  )
}

function Status({ c }: { c: Chat }) {
  if (c.status === 'date_set') return <span className="text-xs font-extrabold tracking-[0.15em] uppercase text-ob">/date set</span>
  if (c.status === 'closed') return <span className="text-xs font-extrabold tracking-[0.15em] uppercase text-[#141414]/40">closed</span>
  return <Clock closesAt={c.closes_at} small />
}

function useNow() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  return now
}

// The 48-hour ring. The one dramatic thing on the page.
function Clock({ closesAt, small }: { closesAt: string; small?: boolean }) {
  const now = useNow()
  const total = 48 * 3600 * 1000
  const left = Math.max(0, new Date(closesAt).getTime() - now)
  const frac = left / total
  const h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000), s = Math.floor((left % 60000) / 1000)
  const size = small ? 44 : 120, r = size / 2 - 5, C = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#14141418" strokeWidth={small ? 4 : 8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FF3B2F" strokeWidth={small ? 4 : 8}
          strokeDasharray={C} strokeDashoffset={C * (1 - frac)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      {!small && (
        <div>
          <div className="font-display font-extrabold text-3xl tracking-tight tabular-nums">{h}h {String(m).padStart(2, '0')}m {String(s).padStart(2, '0')}s</div>
          <div className="text-xs tracking-[0.15em] uppercase text-[#141414]/50">until this closes</div>
        </div>
      )}
      {small && <span className="text-xs font-extrabold tabular-nums">{h}h {String(m).padStart(2, '0')}m</span>}
    </div>
  )
}

function Thread({ chat, me, onBack, onChange }: { chat: Chat; me: string; onBack: () => void; onChange: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [spot, setSpot] = useState(chat.spot_slug ?? VENUES[0].slug)
  const [when, setWhen] = useState('')
  const [debrief, setDebrief] = useState<string | null>(null)
  const [brief, setBrief] = useState(chat.brief)
  const [briefBusy, setBriefBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const mine = msgs.filter((m) => m.from_email === me).length
  const theirs = msgs.filter((m) => m.from_email === chat.them.email).length
  const unlocked = mine >= UNLOCK_AT && theirs >= UNLOCK_AT
  const progress = Math.min(mine, UNLOCK_AT) + Math.min(theirs, UNLOCK_AT)
  const blur = unlocked ? 0 : 18 - progress * 2.5
  const dare = useMemo(() => dareFor(chat.id), [chat.id])

  async function loadMsgs() {
    const { data } = await authClient()!.from('date_messages').select('*').eq('chat_id', chat.id).order('created_at')
    setMsgs((data as Msg[]) ?? [])
  }
  useEffect(() => { loadMsgs(); const t = setInterval(loadMsgs, 4000); return () => clearInterval(t) }, [chat.id])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) }, [msgs.length])

  // Their photo: demo crew from /public, real people from the intake bucket.
  useEffect(() => {
    const demo = getDemo(chat.them.handle)
    if (demo) { setPhoto(demoPhoto(demo.handle)); return }
    if (!chat.them.photo_key) return
    authClient()!.storage.from(INTAKE_BUCKET).download(chat.them.photo_key).then(({ data }) => {
      if (data) setPhoto(URL.createObjectURL(data))
    })
  }, [chat.them.handle, chat.them.photo_key])

  async function send() {
    const body = text.trim()
    if (!body) return
    setText('')
    await authClient()!.from('date_messages').insert({ chat_id: chat.id, from_email: me, body })
    loadMsgs()
  }

  async function setDate() {
    if (!when) return
    await authClient()!.rpc('set_date', { p_chat: chat.id, p_spot: spot, p_at: new Date(when).toISOString() })
    onChange(); onBack()
  }

  async function getBrief() {
    setBriefBusy(true)
    const r = await askVal(authClient()!, { kind: 'brief', chat_id: chat.id })
    setBrief((r.brief as typeof brief) ?? null)
    setBriefBusy(false)
  }

  async function sendDebrief(outcome: string) {
    setDebrief(outcome)
    await authClient()!.rpc('submit_debrief', { p_chat: chat.id, p_outcome: outcome })
    onChange()
  }

  const venue = VENUES.find((v) => v.slug === (chat.spot_slug ?? spot))

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-8">
      <aside className="flex flex-col gap-5">
        <button onClick={onBack} className="text-sm font-semibold text-[#141414]/50 self-start">&larr; All /chats</button>
        <div className="relative rounded-3xl overflow-hidden bg-[#141414] aspect-[4/5]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={chat.them.name} className="w-full h-full object-cover transition-[filter] duration-700" style={{ filter: `blur(${blur}px)`, transform: unlocked ? 'none' : 'scale(1.06)' }} />
          ) : <div className="w-full h-full" style={{ background: '#FF3B2F' }} />}
          {!unlocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
              <div className="font-display font-extrabold text-2xl tracking-tight">Talk first.</div>
              <div className="text-sm mt-1 opacity-80">Photos sharpen as you both write. {progress}/{UNLOCK_AT * 2}</div>
            </div>
          )}
        </div>
        <div>
          <div className="font-display font-extrabold text-3xl tracking-tight">/{chat.them.handle} {chat.them.tag && <span className="text-ob">/{chat.them.tag}</span>}</div>
          <div className="text-sm font-semibold mt-0.5">{chat.them.name}{chat.them.age ? `, ${chat.them.age}` : ''}{chat.them.hood ? ` · ${chat.them.hood}` : ''}</div>
        </div>
        {chat.status === 'open' && <Clock closesAt={chat.closes_at} />}
        {chat.status === 'date_set' && venue && (
          <div className="border-2 border-ob rounded-2xl p-4">
            <div className="text-xs tracking-[0.15em] uppercase font-semibold text-ob">/date set</div>
            <div className="font-display font-extrabold text-xl mt-1">{venue.name}</div>
            <div className="text-sm">{chat.date_at ? new Date(chat.date_at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</div>
            <div className="text-sm text-[#141414]/70 mt-2">{venue.perk}</div>
          </div>
        )}
        {chat.status === 'date_set' && (
          <div className="border-2 border-[#141414] rounded-2xl p-4">
            <div className="text-xs tracking-[0.15em] uppercase font-semibold text-ob">Your /brief</div>
            {brief ? (
              <div className="mt-2 grid gap-3">
                {Object.entries(brief.sections).map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[10px] tracking-[0.18em] uppercase text-[#141414]/50">{k}</div>
                    <div className="text-sm leading-snug">{v}</div>
                  </div>
                ))}
                <div className="text-xs text-[#141414]/50">&mdash; Val</div>
              </div>
            ) : (
              <>
                <p className="text-sm text-[#141414]/70 mt-1">Where to go, what to talk about, what matters to them, what not to do, why this pairing.</p>
                <button onClick={getBrief} disabled={briefBusy} className="mt-3 text-sm font-extrabold text-ob underline underline-offset-4">{briefBusy ? 'Val\u2019s writing\u2026' : 'Read it'}</button>
              </>
            )}
          </div>
        )}
        <ReportBlock chat={chat} onDone={() => { onChange(); onBack() }} />
        <div className="bg-[#FFF3EA] rounded-2xl p-4">
          <div className="text-xs tracking-[0.15em] uppercase font-semibold text-ob">Your /dare</div>
          <div className="font-display font-extrabold text-lg mt-1 leading-snug">{dare}</div>
          <div className="text-xs text-[#141414]/50 mt-2">Val&rsquo;s mission for the first ten minutes.</div>
        </div>
      </aside>

      <section className="flex flex-col min-h-[60vh]">
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
          {chat.val_note && (
            <div className="bg-[#141414] text-white rounded-2xl px-5 py-4 max-w-lg">
              <div className="text-xs tracking-[0.15em] uppercase text-white/50 mb-1">Val</div>
              <div className="text-base leading-snug">{chat.val_note}</div>
            </div>
          )}
          {msgs.filter((m) => m.from_email !== 'val').map((m) => {
            const own = m.from_email === me
            return (
              <div key={m.id} className={`max-w-lg rounded-2xl px-5 py-3 text-base ${own ? 'self-end bg-ob text-white' : 'self-start bg-[#141414]/5'}`}>
                {m.body}
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        {chat.status === 'open' && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Say something worth it." className="flex-1 border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-5 py-3 text-base" />
              <Pill primary onClick={send} disabled={!text.trim()}>Send</Pill>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-[#141414]/10 pt-4">
              <span className="text-xs tracking-[0.15em] uppercase font-semibold text-[#141414]/50 mr-1">Make it a /date</span>
              <select value={spot} onChange={(e) => setSpot(e.target.value)} className="border-2 border-[#141414]/15 rounded-full px-4 py-2 text-sm font-semibold bg-white">
                {VENUES.map((v) => <option key={v.slug} value={v.slug}>{v.name}</option>)}
              </select>
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="border-2 border-[#141414]/15 rounded-full px-4 py-2 text-sm font-semibold bg-white" />
              <Pill primary onClick={setDate} disabled={!when}>Set it</Pill>
            </div>
          </div>
        )}

        {chat.status === 'date_set' && !chat.debriefed && !debrief && chat.date_at && new Date(chat.date_at).getTime() < Date.now() && (
          <div className="mt-6 border-2 border-[#141414] rounded-2xl p-5">
            <div className="font-display font-extrabold text-2xl tracking-tight">How was it with {chat.them.name}?</div>
            <div className="text-sm text-[#141414]/60 mt-1">Private. Never shown to them. It makes the next one better. &mdash; Val</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill primary onClick={() => sendDebrief('second')}>I want a second date</Pill>
              <Pill onClick={() => sendDebrief('good_not')}>Good person, not my person</Pill>
              <Pill onClick={() => sendDebrief('no_spark')}>No spark in person</Pill>
              <Pill onClick={() => sendDebrief('didnt_happen')}>It didn&rsquo;t happen</Pill>
            </div>
          </div>
        )}
        {(chat.debriefed || debrief) && <p className="mt-6 text-sm font-semibold">Got it. Already looking. &mdash; Val</p>}
        {chat.status === 'closed' && <p className="mt-6 text-sm text-[#141414]/60">Time&rsquo;s up on this one. No hard feelings either way. I&rsquo;m already looking. &mdash; Val</p>}
      </section>
    </div>
  )
}

function ReportBlock({ chat, onDone }: { chat: Chat; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  async function send() {
    await authClient()!.rpc('report_handle', { p_handle: chat.them.handle, p_reason: reason || 'report', p_details: null, p_reporter_email: null, p_chat: chat.id })
    onDone()
  }
  return !open ? (
    <button onClick={() => setOpen(true)} className="text-xs text-[#141414]/40 underline underline-offset-4 self-start">Report or block /{chat.them.handle}</button>
  ) : (
    <div className="border-2 border-[#141414]/10 rounded-2xl p-4 grid gap-2">
      <div className="text-sm font-semibold">This closes the /chat and blocks them. Val sees it; they don\u2019t.</div>
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="border-2 border-[#141414]/15 rounded-xl px-3 py-2 text-sm bg-white">
        <option value="">Why?</option>
        <option>Not who they say they are</option>
        <option>Harassing or pressuring</option>
        <option>Didn\u2019t show up</option>
        <option>Something felt off</option>
      </select>
      <div className="flex gap-2">
        <Pill primary onClick={send} disabled={!reason}>Report and block</Pill>
        <Pill onClick={() => setOpen(false)}>Cancel</Pill>
      </div>
    </div>
  )
}
