'use client'

// Every member is approved by a person. This is where it happens: photos,
// voice, answers, age, all on one card. Nothing reaches anyone until you tap
// Approve.
import { useState } from 'react'
import { authClient } from '@/lib/auth'
import { usePhotos } from '@/lib/home'
import { QUESTIONS } from '@/lib/questions'
import { Pill } from '../ui'

type App = {
  id: string; name: string; age: number; email: string; identity: string; seeking: string; neighborhood: string | null
  answers: Record<string, string> | null; photo_keys: string[] | null; voice_key: string | null
  status: string; verified: boolean; created_at: string
  val_vet?: { flags: { level: string; note: string }[]; summary: string | null; ai: boolean } | null
}

export function ApproveTab({ apps, handles, onDone }: { apps: App[]; handles: { email: string; handle: string }[]; onDone: () => void }) {
  const [show, setShow] = useState<'waiting' | 'waitlisted'>('waiting')
  const waiting = apps.filter((a) => a.status === 'pending_review' && !a.email.startsWith('e2e-'))
  const waitlisted = apps.filter((a) => a.status === 'waitlisted' && !a.email.startsWith('e2e-'))
  const list = show === 'waiting' ? waiting : waitlisted
  return (
    <div className="mt-6 grid gap-5 max-w-4xl">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShow('waiting')} className={`rounded-full px-4 py-2 text-sm font-extrabold ${show === 'waiting' ? 'bg-[#141414] text-white' : 'border-2 border-[#141414]/15'}`}>Waiting on you ({waiting.length})</button>
        <button onClick={() => setShow('waitlisted')} className={`rounded-full px-4 py-2 text-sm font-extrabold ${show === 'waitlisted' ? 'bg-[#141414] text-white' : 'border-2 border-[#141414]/15'}`}>Waitlist ({waitlisted.length})</button>
      </div>
      <p className="text-sm text-[#141414]/60 max-w-xl">Nobody can send or receive a /hey, show up in a pool, or have a live /name page until you approve them here. Check that the photos look like one real person, the voice matches, and they&rsquo;re over 18.</p>
      {list.length === 0 && <p className="text-sm">{show === 'waiting' ? 'Nobody waiting. Nice.' : 'Nobody on the waitlist.'}</p>}
      {list.map((a) => <Card key={a.id} a={a} handle={handles.find((h) => h.email === a.email)?.handle} onDone={onDone} />)}
    </div>
  )
}

function Card({ a, handle, onDone }: { a: App; handle?: string; onDone: () => void }) {
  const photos = usePhotos(a.photo_keys ?? [])
  const [voice, setVoice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function play() {
    if (!a.voice_key || voice) return
    const { data } = await authClient()!.storage.from('date-intake').download(a.voice_key)
    if (data) setVoice(URL.createObjectURL(data))
  }
  async function act(status?: string, verify?: boolean) {
    setBusy(true)
    const c = authClient()!
    if (verify !== undefined) await c.rpc('set_verified', { p_app: a.id, p_verified: verify })
    if (status) await c.rpc('set_application_status', { p_id: a.id, p_status: status })
    setBusy(false); onDone()
  }
  const young = a.age < 21
  return (
    <div className="rounded-3xl border-2 border-[#141414]/10 p-5 grid gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="font-display font-extrabold text-3xl tracking-tight">{handle ? `/${handle}` : a.name}</div>
          <div className="text-sm font-semibold">{a.name}, <span className={young ? 'text-ob' : ''}>{a.age}</span> &middot; {a.identity} seeking {a.seeking}{a.neighborhood ? ` · ${a.neighborhood}` : ''}</div>
          <div className="text-xs text-[#141414]/50 mt-0.5">{a.email} &middot; applied {new Date(a.created_at).toLocaleString()}</div>
        </div>
        {a.verified && <span className="text-xs font-extrabold uppercase tracking-[0.12em] bg-[#141414] text-white rounded-full px-3 py-1">Verified</span>}
      </div>

      <ValVet v={a.val_vet} />

      <div className="flex gap-2 overflow-x-auto">
        {(a.photo_keys ?? []).map((k) => photos[k]
          ? /* eslint-disable-next-line @next/next/no-img-element */ <img key={k} src={photos[k]} alt="" className="h-48 aspect-[4/5] object-cover rounded-2xl shrink-0" />
          : <div key={k} className="h-48 aspect-[4/5] rounded-2xl bg-[#141414]/5 shrink-0" />)}
        {!(a.photo_keys ?? []).length && <p className="text-sm text-ob font-semibold">No photos.</p>}
      </div>

      {a.voice_key
        ? (voice ? <audio src={voice} controls autoPlay className="w-full" /> : <button onClick={play} className="justify-self-start rounded-full border-2 border-[#141414] px-4 py-2 text-sm font-extrabold">Play their voice</button>)
        : <p className="text-sm text-ob font-semibold">No voice note.</p>}

      <details>
        <summary className="cursor-pointer text-sm font-extrabold">Their answers</summary>
        <div className="mt-2 grid gap-2 text-sm">
          {QUESTIONS.filter((q) => a.answers?.[q.id]).map((q) => (
            <div key={q.id}><span className="text-[#141414]/50">{q.prompt}</span> &mdash; {a.answers![q.id]}</div>
          ))}
          {(a.answers?.age_min || a.answers?.age_max) && <div><span className="text-[#141414]/50">Age range wanted</span> &mdash; {a.answers?.age_min ?? '?'}–{a.answers?.age_max ?? '?'}</div>}
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <Pill primary disabled={busy} onClick={() => act('approved', true)}>Approve &amp; verify</Pill>
        <Pill disabled={busy} onClick={() => act('approved')}>Approve</Pill>
        {a.status !== 'waitlisted' && <Pill disabled={busy} onClick={() => act('waitlisted')}>Waitlist</Pill>}
        <Pill disabled={busy} onClick={() => act('rejected')}>Decline</Pill>
      </div>
    </div>
  )
}

// Val's pre-read: what a careful person should look at. She never decides.
function ValVet({ v }: { v: App['val_vet'] }) {
  if (!v) return <p className="text-xs text-[#141414]/45">Val is still looking at this one.</p>
  const high = v.flags.filter((f) => f.level === 'high')
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm ${high.length ? 'bg-ob/10 border-2 border-ob' : 'bg-[#141414]/[0.04]'}`}>
      <div className="font-extrabold">{high.length ? 'Val says look closer' : v.flags.length ? 'Val noticed' : 'Val sees nothing off'}</div>
      {v.summary && <p className="mt-1">{v.summary}</p>}
      {v.flags.length > 0 && (
        <ul className="mt-1.5 grid gap-0.5">
          {v.flags.map((f, i) => <li key={i} className={f.level === 'high' ? 'font-semibold text-ob' : 'text-[#141414]/70'}>{f.level === 'high' ? '● ' : '○ '}{f.note}</li>)}
        </ul>
      )}
      <div className="mt-1.5 text-xs text-[#141414]/45">{v.ai ? 'Val looked at the photos and answers. The call is yours.' : 'Basic checks only; Val’s eyes switch on with her key. The call is yours.'}</div>
    </div>
  )
}
