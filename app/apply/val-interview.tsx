'use client'

// Talk it through with Val. She asks the eight out loud (real recorded voice,
// the phone's own voice as backup, captions always); the phone listens; the
// parser proposes; the person confirms. Nothing is saved that they didn't
// see and accept. Every failure lands on tap-or-type, never a dead end.
import { useCallback, useEffect, useRef, useState } from 'react'
import { QUESTIONS } from '@/lib/questions'
import { matchChoice, tidy, type Heard } from '@/lib/voice'
import { askVal } from '@/lib/val'
import { authClient } from '@/lib/auth'

const KEY = 'date:vibe-voice'
const LINES: Record<string, string> = {
  intro: 'Hey, it’s Val. Eight quick questions, out loud. Say it however it comes out — I’ll show you what I heard before anything’s saved.',
  conflict_impulse: 'First one. When you’re in conflict with someone you love, what’s your first impulse? Pick one, or just tell me.',
  pull_away: 'When someone you care about pulls away… what do you do?',
  saturday: 'Your ideal Saturday. Honestly.',
  life_stage: 'Where are you in life right now? Honestly.',
  looking_for: 'What are you actually looking for?',
  commitment: 'What does commitment look like, when it’s working? A sentence or two. Your words.',
  misread: 'What do people most often get wrong about you?',
  non_negotiables: 'Last one. Your non-negotiables. Up to three. The real ones.',
  outro: 'That’s all eight. Check what I heard, fix anything, and we’re on to photos.',
}

/* ── Val's voice: recorded clip → phone voice → captions only ── */
function useValVoice() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const onDone = useRef<() => void>(() => {})
  const dog = useRef<ReturnType<typeof setTimeout> | null>(null)
  const done = useRef(true)

  // Exactly once per line, whatever happens: ended, errored, or went silent.
  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    if (dog.current) clearTimeout(dog.current)
    setSpeaking(false); onDone.current()
  }, [])
  const watch = useCallback((ms: number) => {
    if (dog.current) clearTimeout(dog.current)
    dog.current = setTimeout(finish, ms)
  }, [finish])

  const fallbackSpeak = useCallback((id: string) => {
    try {
      const u = new SpeechSynthesisUtterance(LINES[id].replace(/[—…]/g, ', '))
      u.rate = 1.02
      u.onend = finish
      u.onerror = finish
      speechSynthesis.cancel(); speechSynthesis.speak(u); setSpeaking(true)
      watch(1500 + LINES[id].length * 75)                 // some phones never fire onend
    } catch { finish() }
  }, [finish, watch])

  const say = useCallback((id: string, then?: () => void) => {
    onDone.current = then ?? (() => {})
    done.current = false
    if (!audio.current) audio.current = new Audio()
    const a = audio.current
    a.onplay = () => { setSpeaking(true); setBlocked(false); watch(((a.duration || 10) + 3) * 1000) }
    a.onended = finish
    a.onerror = () => { if (!done.current) fallbackSpeak(id) }
    a.src = `/val/${id}.mp3`
    watch(6000)                                           // never loaded? move on
    a.play().catch((e: DOMException) => {
      // Autoplay blocked: wait for a tap (the watchdog still moves things on). Anything else: the phone's voice.
      if (e?.name === 'NotAllowedError') { setBlocked(true); setSpeaking(false) } else if (!done.current) fallbackSpeak(id)
    })
  }, [fallbackSpeak, finish, watch])

  const stop = useCallback(() => {
    done.current = true
    if (dog.current) clearTimeout(dog.current)
    audio.current?.pause(); try { speechSynthesis.cancel() } catch {}; setSpeaking(false)
  }, [])
  return { say, stop, speaking, blocked }
}

/* ── The phone's ear. Stops itself after a pause. ── */
type EarState = 'idle' | 'listening' | 'denied' | 'unsupported' | 'error'
function useEar(onFinal: (text: string, forId: string) => void) {
  const rec = useRef<any>(null)
  const cb = useRef(onFinal); cb.current = onFinal      // always the latest handler
  const forId = useRef('')                               // which question this session belongs to
  const [state, setState] = useState<EarState>('idle')
  const [live, setLive] = useState('')
  const base = useRef('')
  const silence = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef('')

  // Decided after mount, so server and phone render the same first frame.
  const [Rec, setRec] = useState<any>(null)
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    const R = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (R) setRec(() => R); else setState('unsupported')
    setChecked(true)
  }, [])

  const finish = useCallback(() => {
    if (silence.current) clearTimeout(silence.current)
    try { rec.current?.stop() } catch {}
  }, [])

  const start = useCallback((id: string, keep = false) => {
    if (!Rec) { setState('unsupported'); return }
    try { rec.current?.abort() } catch {}
    forId.current = id
    base.current = keep ? latest.current : ''
    latest.current = base.current; setLive(base.current)
    const r = new Rec()
    r.lang = 'en-US'; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1
    r.onresult = (e: any) => {
      let fin = '', int = ''
      for (let i = 0; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript
        if (e.results[i].isFinal) fin += txt + ' '; else int += txt
      }
      latest.current = (base.current + ' ' + fin + int).replace(/\s+/g, ' ').trim()
      setLive(latest.current)
      if (silence.current) clearTimeout(silence.current)
      silence.current = setTimeout(finish, 2400)            // they paused: done
    }
    r.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setState('denied')
      else if (e.error !== 'no-speech' && e.error !== 'aborted') setState('error')
    }
    r.onend = () => {
      if (silence.current) clearTimeout(silence.current)
      setState((s) => (s === 'listening' ? 'idle' : s))
      cb.current(latest.current, forId.current)
    }
    try { r.start(); rec.current = r; setState('listening') } catch { setState('error') }
  }, [Rec, finish])

  useEffect(() => () => { try { rec.current?.abort() } catch {} }, [])
  return { state, live, start, stop: finish, supported: Boolean(Rec), checked }
}

type Saved = { i: number; answers: Record<string, string>; heard: Record<string, string> }

export default function ValInterview({ initial, onDone, onType }: {
  initial: Record<string, string>
  onDone: (answers: Record<string, string>) => void
  onType: (answers: Record<string, string>, at: number) => void
}) {
  const [stage, setStage] = useState<'start' | 'ask' | 'review'>('start')
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(initial)
  const [heard, setHeard] = useState<Record<string, string>>({})
  const [guess, setGuess] = useState<Heard | null>(null)
  const [thinking, setThinking] = useState(false)
  const [editing, setEditing] = useState(false)       // came from review
  const val = useValVoice()
  const q = QUESTIONS[i]
  const iRef = useRef(i); iRef.current = i

  // Resume where they left off.
  useEffect(() => {
    try {
      const s: Saved | null = JSON.parse(localStorage.getItem(KEY) ?? 'null')
      if (s) { setAnswers((a) => ({ ...s.answers, ...a })); setHeard(s.heard ?? {}); setI(Math.min(s.i, QUESTIONS.length - 1)) }
    } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ i, answers, heard })) } catch {} }, [i, answers, heard])

  const onFinal = useCallback(async (text: string, forId: string) => {
    const said = text.trim()
    const q = QUESTIONS.find((x) => x.id === forId)
    if (!said || !q) return
    setHeard((h) => ({ ...h, [q.id]: said }))
    if (q.kind === 'text') { setAnswers((a) => ({ ...a, [q.id]: tidy(said) })); return }
    const local = matchChoice(q.id, said, q.options!)
    const here = () => QUESTIONS[iRef.current]?.id === q.id
    if (here()) setGuess(local)
    if (local.index !== null) setAnswers((a) => ({ ...a, [q.id]: q.options![local.index!] }))
    if (local.confidence === 'high') return
    // Not sure: ask Val's brain, briefly. If she's not there or slow, the local read stands.
    setThinking(true)
    try {
      const c = authClient()
      const r = c ? await Promise.race([
        askVal(c, { kind: 'parse', question: q.prompt, options: q.options, said }),
        new Promise<Record<string, unknown>>((res) => setTimeout(() => res({}), 4000)),
      ]) : {}
      const idx = typeof r.index === 'number' ? r.index : null
      if (idx !== null && Number(r.confidence) >= 0.7) {
        if (here()) setGuess({ index: idx, confidence: 'high', suggestion: idx })
        setAnswers((a) => ({ ...a, [q.id]: q.options![idx] }))
      }
    } finally { setThinking(false) }
  }, [])

  const ear = useEar(onFinal)
  const earRef = useRef(ear); earRef.current = ear

  function ask(n: number) {
    setI(n); setGuess(null); setStage('ask')
    const id = QUESTIONS[n].id
    val.say(id, () => { if (earRef.current.supported && earRef.current.state !== 'denied') earRef.current.start(id) })
  }
  function begin() { val.say('intro', () => ask(i)) }
  function next() {
    ear.stop(); val.stop()
    if (editing) { setEditing(false); setStage('review'); return }
    if (i < QUESTIONS.length - 1) ask(i + 1)
    else { setStage('review'); val.say('outro') }
  }
  function finish() { try { localStorage.removeItem(KEY) } catch {}; onDone(answers) }

  const answered = (answers[q?.id] ?? '').trim().length > 0
  const listening = ear.state === 'listening'
  const canHear = ear.supported && ear.state !== 'denied' && ear.state !== 'unsupported'

  /* ── Start ── */
  if (stage === 'start') return (
    <div className="flex-1 flex flex-col justify-center max-w-lg">
      <ValBadge speaking={val.speaking} />
      <h1 className="mt-6 font-display font-extrabold text-5xl sm:text-6xl tracking-[-0.03em] leading-[0.95]">Talk it through with Val.</h1>
      <p className="mt-4 text-xl text-[#141414]/70 leading-snug">Eight questions, out loud, about three minutes. She shows you what she heard before anything is saved.</p>
      {ear.checked && !ear.supported && <p className="mt-4 text-sm font-semibold text-ob">This browser can&rsquo;t listen. Val will still ask out loud; you tap or type.</p>}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button onClick={begin} className="bg-ob text-white rounded-full px-8 py-4 font-extrabold text-lg">Start with Val</button>
        <button onClick={() => onType(answers, 0)} className="border-2 border-[#141414] rounded-full px-8 py-4 font-extrabold">I&rsquo;d rather type</button>
      </div>
      <p className="mt-4 text-sm text-[#141414]/50">Somewhere loud? Type instead. You can switch any time.</p>
    </div>
  )

  /* ── Review ── */
  if (stage === 'review') {
    const missing = QUESTIONS.filter((x) => !(answers[x.id] ?? '').trim())
    return (
      <div className="flex-1 max-w-2xl">
        <div className="text-xs tracking-[0.2em] uppercase font-extrabold text-ob">What Val heard</div>
        <h1 className="mt-2 font-display font-extrabold text-4xl sm:text-5xl tracking-[-0.03em]">Look right?</h1>
        <p className="mt-2 text-[#141414]/60">Tap any answer to fix it. This is what Val will read.</p>
        <ol className="mt-6 grid gap-2">
          {QUESTIONS.map((x, n) => (
            <li key={x.id}>
              <button onClick={() => { setEditing(true); setI(n); setGuess(null); setStage('ask') }}
                className="w-full text-left rounded-2xl bg-white border-2 border-[#141414]/10 hover:border-[#141414] px-4 py-3">
                <div className="text-xs font-extrabold text-[#141414]/45">{n + 1}. {x.prompt}</div>
                <div className={`mt-1 font-semibold ${answers[x.id] ? '' : 'text-ob'}`}>{answers[x.id] || 'Not answered yet, tap to add'}</div>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button disabled={missing.length > 0} onClick={finish} className="bg-ob text-white rounded-full px-8 py-4 font-extrabold disabled:opacity-40">That&rsquo;s me &rarr; photos</button>
          {missing.length > 0 && <span className="text-sm font-semibold text-ob">{missing.length} to go</span>}
        </div>
      </div>
    )
  }

  /* ── One question ── */
  return (
    <div className="flex-1 flex flex-col max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <ol className="flex gap-1.5 flex-1" aria-label={`Question ${i + 1} of ${QUESTIONS.length}`}>
          {QUESTIONS.map((x, n) => <li key={x.id} className={`h-1.5 flex-1 rounded-full ${n < i ? 'bg-ob' : n === i ? 'bg-[#141414]' : 'bg-[#141414]/10'}`} />)}
        </ol>
        <button onClick={() => { ear.stop(); val.stop(); onType(answers, i) }} className="tap text-sm font-bold text-[#141414]/50 underline underline-offset-4 shrink-0">Type instead</button>
      </div>

      <div className="mt-6 flex items-start gap-4">
        <ValBadge speaking={val.speaking} small />
        <div className="min-w-0">
          <div className="text-xs tracking-[0.2em] uppercase font-extrabold text-ob">Val &middot; {i + 1} of {QUESTIONS.length}</div>
          <h2 className="mt-1 font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.02em] leading-tight">{q.prompt}</h2>
          {val.blocked && <button onClick={() => ask(i)} className="mt-2 text-sm font-extrabold text-ob underline underline-offset-4 py-2">&#9654; Hear Val</button>}
        </div>
      </div>

      {q.kind === 'choice' && (
        <div className="mt-6 grid gap-2">
          {q.options!.map((o, n) => {
            const picked = answers[q.id] === o
            const closest = !picked && guess?.confidence === 'low' && guess.suggestion === n
            return (
              <button key={o} onClick={() => setAnswers({ ...answers, [q.id]: o })}
                className={`text-left rounded-2xl border-2 px-4 py-3.5 transition-colors ${picked ? 'border-ob bg-ob text-white' : closest ? 'border-ob border-dashed bg-white' : 'border-[#141414]/10 bg-white hover:border-[#141414]/40'}`}>
                <span className="font-semibold">{o}</span>
                {picked && guess?.index === n && <span className="block text-xs font-extrabold uppercase tracking-[0.12em] mt-1 text-white/80">Val&rsquo;s pick from what you said</span>}
                {closest && <span className="block text-xs font-extrabold uppercase tracking-[0.12em] mt-1 text-ob">Closest to what you said? Tap to confirm</span>}
              </button>
            )
          })}
        </div>
      )}

      {q.kind === 'text' && (
        <textarea value={answers[q.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} rows={3}
          placeholder={canHear ? 'Say it, and Val writes it here. Edit anything.' : q.placeholder}
          className="mt-6 w-full bg-white border-2 border-[#141414]/12 focus:border-ob outline-none rounded-2xl px-4 py-3 text-lg resize-none" />
      )}

      {/* What Val is hearing */}
      <div className="mt-4 min-h-[3.5rem]">
        {listening && <p className="text-lg text-[#141414]/80"><span className="inline-block w-2 h-2 rounded-full bg-ob animate-pulse mr-2 align-middle" />{ear.live || 'Listening…'}</p>}
        {!listening && heard[q.id] && q.kind === 'choice' && (
          <p className="text-sm text-[#141414]/60">Val heard: &ldquo;{heard[q.id]}&rdquo;{thinking ? ' · thinking…' : guess?.confidence === 'none' ? ' · tap the one that fits.' : ''}</p>
        )}
        {ear.state === 'denied' && <p className="text-sm font-semibold text-ob">Microphone is off for this site. Tap or type your answer; allow the mic in settings to talk.</p>}
        {ear.state === 'error' && <p className="text-sm font-semibold text-ob">Val lost the line for a second. Tap the mic to try again, or tap/type.</p>}
      </div>

      <div className="mt-auto pt-6 flex flex-wrap items-center gap-3" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {canHear && (
          listening ? (
            <button onClick={ear.stop} className="w-16 h-16 rounded-full bg-ob text-white grid place-items-center shadow-lg" aria-label="Done talking">
              <span className="w-5 h-5 rounded-sm bg-white" />
            </button>
          ) : (
            <button onClick={() => { val.stop(); ear.start(q.id, q.kind === 'text' && Boolean(answers[q.id])) }} className="w-16 h-16 rounded-full bg-[#141414] text-white grid place-items-center" aria-label="Talk">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
            </button>
          )
        )}
        <button onClick={next} disabled={!answered || listening} className="flex-1 sm:flex-none bg-ob text-white rounded-full px-8 py-4 font-extrabold disabled:opacity-30">
          {editing ? 'Save' : i < QUESTIONS.length - 1 ? 'That’s right, next' : 'That’s right, done'}
        </button>
        {!editing && i > 0 && <button onClick={() => { ear.stop(); ask(i - 1) }} className="tap text-sm font-bold text-[#141414]/50 px-2">Back</button>}
      </div>
    </div>
  )
}

function ValBadge({ speaking, small }: { speaking: boolean; small?: boolean }) {
  const size = small ? 'w-12 h-12 text-2xl' : 'w-20 h-20 text-4xl'
  return (
    <div className="relative shrink-0">
      <div className={`${size} rounded-full bg-ob text-white grid place-items-center font-display font-extrabold`}>/</div>
      <div className={`absolute -bottom-1 -right-1 flex items-end gap-[2px] h-4 px-1 rounded-full bg-[#141414] ${speaking ? '' : 'opacity-0'} transition-opacity`} aria-hidden>
        {[0, 1, 2].map((n) => <span key={n} className="w-[3px] bg-white rounded-full animate-[valbar_0.9s_ease-in-out_infinite]" style={{ height: 10, animationDelay: `${n * 0.15}s` }} />)}
      </div>
    </div>
  )
}
