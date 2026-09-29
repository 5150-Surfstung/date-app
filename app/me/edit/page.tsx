'use client'

// Edit your /vibe. Everything but age and email (those are how Val verifies
// you). Photos and voice live in your own folder; only you can write there.
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { AppShell, NeedLogin } from '../../ui'
import { authClient } from '@/lib/auth'
import { QUESTIONS } from '@/lib/questions'
import { useHome, usePhotos } from '@/lib/home'

const MIN_PHOTOS = 3
const MAX_PHOTOS = 10
type Photo = { key?: string; file?: File; url: string }

export default function EditVibe() {
  const { email, loading, home, reload } = useHome()
  const v = home?.vibe
  const saved = usePhotos(v?.photo_keys)
  const [hood, setHood] = useState('')
  const [identity, setIdentity] = useState('')
  const [seeking, setSeeking] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<Photo[]>([])
  const [voice, setVoice] = useState<Blob | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const inited = useRef(false)

  useEffect(() => {
    if (!v || inited.current) return
    inited.current = true
    setHood(v.neighborhood ?? ''); setIdentity(v.identity); setSeeking(v.seeking); setAnswers(v.answers ?? {})
  }, [v])
  useEffect(() => {
    if (!v) return
    setPhotos((cur) => cur.length ? cur : v.photo_keys.map((k) => ({ key: k, url: saved[k] ?? '' })))
    setPhotos((cur) => cur.map((p) => (p.key && !p.url && saved[p.key] ? { ...p, url: saved[p.key] } : p)))
  }, [v, saved])

  if (loading) return <AppShell title="Edit /vibe"><p>One sec…</p></AppShell>
  if (!email) return <AppShell title="Edit /vibe"><NeedLogin /></AppShell>
  if (!v) return (
    <AppShell title="Edit /vibe">
      <h1 className="font-display font-extrabold text-4xl tracking-tight">No /vibe yet.</h1>
      <Link href="/apply/" className="inline-block mt-6 bg-ob text-white rounded-full px-7 py-3.5 font-extrabold">Start my /vibe</Link>
    </AppShell>
  )

  function add(list: FileList | null) {
    if (!list) return
    const more = Array.from(list).filter((f) => f.type.startsWith('image/')).map((f) => ({ file: f, url: URL.createObjectURL(f) }))
    setPhotos((p) => [...p, ...more].slice(0, MAX_PHOTOS))
  }
  function move(i: number, d: -1 | 1) {
    setPhotos((p) => { const n = [...p]; const j = i + d; if (j < 0 || j >= n.length) return p; [n[i], n[j]] = [n[j], n[i]]; return n })
  }

  async function save() {
    if (!v) return
    setBusy(true); setMsg(null)
    try {
      const c = authClient()!
      const stamp = Date.now()
      const keys: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i]
        if (p.key) { keys.push(p.key); continue }
        const ext = (p.file!.name.split('.').pop() || 'jpg').toLowerCase()
        const key = `${v.id}/photo-${stamp}-${i}.${ext}`
        const { error } = await c.storage.from('date-intake').upload(key, p.file!, { contentType: p.file!.type || 'image/jpeg' })
        if (error) throw new Error('A photo didn’t upload. Try again.')
        keys.push(key)
      }
      let voiceKey: string | null = null
      if (voice) {
        const ext = voice.type.includes('mp4') ? 'mp4' : 'webm'
        voiceKey = `${v.id}/voice-note.${ext}`
        const { error } = await c.storage.from('date-intake').upload(voiceKey, voice, { contentType: voice.type || 'audio/webm', upsert: true })
        if (error) throw new Error('Your voice note didn’t upload. Try again.')
      }
      const { data, error } = await c.rpc('update_my_vibe', {
        p_neighborhood: hood, p_identity: identity, p_seeking: seeking, p_answers: answers, p_photo_keys: keys, p_voice_key: voiceKey,
      })
      if (error || data !== 'ok') throw new Error('Couldn’t save. Try again.')
      const gone = v.photo_keys.filter((k) => !keys.includes(k))
      if (gone.length) await c.storage.from('date-intake').remove(gone)
      await reload()
      setVoice(null)
      setMsg('Saved. Val reads the newest version.')
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setBusy(false) }
  }

  const enough = photos.length >= MIN_PHOTOS
  return (
    <AppShell title="Edit /vibe">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-[-0.03em]">Your /vibe.</h1>
        <Link href="/me/" className="tap text-sm font-extrabold text-[#141414]/50">Done</Link>
      </div>
      <p className="mt-2 text-[#141414]/60">{v.age} &middot; {email}. Age and email are how Val verifies you; to change them, <a className="underline" href="mailto:hello@surfstung.com">ask a person</a>.</p>

      <Block title={`Photos · ${photos.length}/${MAX_PHOTOS}`} hint="First one leads. Three minimum. Real, recent, you.">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {photos.map((p, i) => (
            <div key={(p.key ?? p.url) + i} className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#141414]/5">
              {p.url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.url} alt="" className="w-full h-full object-cover" />}
              {i === 0 && <span className="absolute left-2 top-2 text-[10px] font-extrabold tracking-[0.12em] uppercase bg-ob text-white rounded-full px-2 py-0.5">Lead</span>}
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
                <button aria-label="Move left" onClick={() => move(i, -1)} disabled={i === 0} className="w-9 h-9 rounded-full bg-white/90 text-[#141414] font-extrabold disabled:opacity-0">&lsaquo;</button>
                <button aria-label="Remove" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))} className="w-9 h-9 rounded-full bg-[#141414]/85 text-white font-extrabold">&times;</button>
                <button aria-label="Move right" onClick={() => move(i, 1)} disabled={i === photos.length - 1} className="w-9 h-9 rounded-full bg-white/90 text-[#141414] font-extrabold disabled:opacity-0">&rsaquo;</button>
              </div>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="aspect-[4/5] rounded-2xl border-2 border-dashed border-[#141414]/20 hover:border-ob grid place-items-center cursor-pointer text-center">
              <span className="font-extrabold text-sm px-2"><span className="block text-3xl leading-none text-ob">+</span>Add</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = '' }} />
            </label>
          )}
        </div>
        {!enough && <p className="mt-2 text-sm font-semibold text-ob">Three photos minimum.</p>}
      </Block>

      <Block title="Sixty seconds of you" hint={v.voice_key ? 'Your voice note is in. Record a new one to replace it.' : 'No voice note yet. It’s the thing people remember.'}>
        <Recorder onDone={setVoice} pending={Boolean(voice)} />
      </Block>

      <Block title="The basics">
        <div className="grid gap-4 max-w-md">
          <label className="grid gap-1.5">
            <span className="text-xs tracking-[0.15em] uppercase font-extrabold text-[#141414]/45">Neighborhood</span>
            <input value={hood} onChange={(e) => setHood(e.target.value)} className="border-2 border-[#141414]/15 focus:border-ob outline-none rounded-xl px-4 py-3" />
          </label>
          <Choices label="I am" options={['Woman', 'Man', 'Nonbinary']} value={identity} onChange={setIdentity} />
          <Choices label="Seeking" options={['Women', 'Men', 'Everyone']} value={seeking} onChange={setSeeking} />
          <div className="grid grid-cols-2 gap-3">
            {(['age_min', 'age_max'] as const).map((k) => (
              <label key={k} className="grid gap-1.5">
                <span className="text-xs tracking-[0.15em] uppercase font-extrabold text-[#141414]/45">{k === 'age_min' ? 'Age from' : 'Age to'}</span>
                <input type="number" inputMode="numeric" min={18} max={99} value={answers[k] ?? ''} onChange={(e) => setAnswers({ ...answers, [k]: e.target.value })}
                  className="border-2 border-[#141414]/15 focus:border-ob outline-none rounded-xl px-4 py-3" />
              </label>
            ))}
          </div>
        </div>
      </Block>

      <Block title="The eight">
        <div className="grid gap-6 max-w-2xl">
          {QUESTIONS.map((q) => (
            <div key={q.id}>
              <div className="font-extrabold leading-snug">{q.prompt}</div>
              {q.kind === 'choice' ? (
                <div className="mt-2 grid gap-2">
                  {q.options!.map((o) => (
                    <button key={o} onClick={() => setAnswers({ ...answers, [q.id]: o })}
                      className={`text-left rounded-xl border-2 px-4 py-3 text-sm ${answers[q.id] === o ? 'border-ob bg-ob/5 font-semibold' : 'border-[#141414]/10 hover:border-[#141414]/40'}`}>{o}</button>
                  ))}
                </div>
              ) : (
                <textarea value={answers[q.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} rows={3} placeholder={q.placeholder}
                  className="mt-2 w-full border-2 border-[#141414]/15 focus:border-ob outline-none rounded-xl px-4 py-3 resize-none" />
              )}
            </div>
          ))}
        </div>
      </Block>

      <div className="sticky bottom-0 -mx-5 sm:-mx-12 mt-10 px-5 sm:px-12 py-4 bg-white/95 backdrop-blur border-t border-[#141414]/10 flex items-center gap-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <button onClick={save} disabled={busy || !enough} className="bg-ob text-white rounded-full px-8 py-3.5 font-extrabold disabled:opacity-40">{busy ? 'Saving…' : 'Save my /vibe'}</button>
        {msg && <span className="text-sm font-semibold">{msg}</span>}
      </div>
    </AppShell>
  )
}

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="text-xs tracking-[0.18em] uppercase font-extrabold text-[#141414]/45">{title}</div>
      {hint && <p className="mt-1 mb-3 text-sm text-[#141414]/60">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  )
}

function Choices({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs tracking-[0.15em] uppercase font-extrabold text-[#141414]/45">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} className={`rounded-full border-2 px-4 py-2.5 text-sm font-extrabold ${value === o ? 'bg-[#141414] text-white border-[#141414]' : 'border-[#141414]/15'}`}>{o}</button>
        ))}
      </div>
    </div>
  )
}

function Recorder({ onDone, pending }: { onDone: (b: Blob) => void; pending: boolean }) {
  const [state, setState] = useState<'idle' | 'rec' | 'done' | 'denied'>('idle')
  const [secs, setSecs] = useState(0)
  const [url, setUrl] = useState<string | null>(null)
  const rec = useRef<MediaRecorder | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream); const chunks: Blob[] = []
      r.ondataavailable = (e) => chunks.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const b = new Blob(chunks, { type: r.mimeType || 'audio/webm' })
        setUrl(URL.createObjectURL(b)); onDone(b); setState('done')
      }
      rec.current = r; r.start(); setSecs(0); setState('rec')
      timer.current = setInterval(() => setSecs((s) => { if (s >= 59) { stop(); return 60 } return s + 1 }), 1000)
    } catch { setState('denied') }
  }
  function stop() { if (timer.current) clearInterval(timer.current); rec.current?.state === 'recording' && rec.current.stop() }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {state !== 'rec' ? (
        <button onClick={start} className="flex items-center gap-2 bg-[#141414] text-white rounded-full px-6 py-3.5 font-extrabold">
          <span className="w-3 h-3 rounded-full bg-ob" /> {state === 'done' ? 'Record again' : 'Record'}
        </button>
      ) : (
        <button onClick={stop} className="flex items-center gap-3 bg-ob text-white rounded-full px-6 py-3.5 font-extrabold">
          <span className="w-3 h-3 rounded-sm bg-white animate-pulse" /> Stop · 0:{String(secs).padStart(2, '0')}
        </button>
      )}
      {url && <audio src={url} controls className="h-10 max-w-full" />}
      {pending && <span className="text-sm font-semibold text-ob">New note ready. Save to keep it.</span>}
      {state === 'denied' && <span className="text-sm text-ob">Mic blocked. Allow it in your browser settings.</span>}
    </div>
  )
}
