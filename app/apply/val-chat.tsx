'use client'

// The /vibe as a real conversation with Val. She opens, you talk, she reacts to
// what you actually said and asks the next thing, and the eight answers fill in
// as you go. Nothing is saved until you see it on "Look right?".
// If her brain is off or drops mid-way, the scripted interview picks up exactly
// where you are, so there is never a dead end.
import { useCallback, useEffect, useRef, useState } from 'react'
import { QUESTIONS } from '@/lib/questions'
import { askVal } from '@/lib/val'
import { authClient } from '@/lib/auth'
import ValInterview, { useEar } from './val-interview'

type Turn = { who: 'val' | 'you'; text: string }
type Reply = { say?: string; answers?: Record<string, string>; done?: boolean; unavailable?: boolean }
const KEY = 'date:vibe-chat'
const QS = QUESTIONS.map(({ id, prompt, kind, options }) => ({ id, prompt, kind, options }))

/* ── Val's voice for lines she writes on the spot: the phone's own voice, captions always ── */
function useSpeak() {
  const [speaking, setSpeaking] = useState(false)
  const dog = useRef<ReturnType<typeof setTimeout> | null>(null)
  const voice = useRef<SpeechSynthesisVoice | null>(null)
  useEffect(() => {
    const pick = () => {
      const vs = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'))
      voice.current = vs.find((v) => /Samantha|Ava|Google US English|Jenny|Aria/i.test(v.name)) ?? vs.find((v) => v.lang === 'en-US') ?? vs[0] ?? null
    }
    try { pick(); speechSynthesis.onvoiceschanged = pick } catch {}
  }, [])
  const say = useCallback((text: string, then: () => void) => {
    let done = false
    const end = () => { if (done) return; done = true; if (dog.current) clearTimeout(dog.current); setSpeaking(false); then() }
    try {
      const u = new SpeechSynthesisUtterance(text.replace(/[—–]/g, ', ').replace(/\//g, ' slash '))
      if (voice.current) u.voice = voice.current
      u.rate = 1.03; u.onend = end; u.onerror = end
      speechSynthesis.cancel(); speechSynthesis.speak(u); setSpeaking(true)
      dog.current = setTimeout(end, 1500 + text.length * 80)          // some phones never fire onend
    } catch { end() }
  }, [])
  const stop = useCallback(() => { try { speechSynthesis.cancel() } catch {}; if (dog.current) clearTimeout(dog.current); setSpeaking(false) }, [])
  return { say, stop, speaking }
}

export default function ValChat({ initial, onDone, onType }: {
  initial: Record<string, string>
  onDone: (answers: Record<string, string>) => void
  onType: (answers: Record<string, string>, at: number) => void
}) {
  const [stage, setStage] = useState<'start' | 'talk' | 'review' | 'scripted'>('start')
  const [turns, setTurns] = useState<Turn[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>(initial)
  const [thinking, setThinking] = useState(false)
  const [typed, setTyped] = useState('')
  const [quiet, setQuiet] = useState(false)          // muted: captions only, type or talk
  const speak = useSpeak()
  const endRef = useRef<HTMLDivElement>(null)
  const state = useRef({ turns, answers }); state.current = { turns, answers }

  // Resume a conversation they left.
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? 'null')
      if (s?.turns?.length) { setTurns(s.turns); setAnswers((a) => ({ ...s.answers, ...a })) }
    } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ turns, answers })) } catch {} }, [turns, answers])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [turns, thinking])

  const firstMissing = () => Math.max(0, QUESTIONS.findIndex((q) => !(state.current.answers[q.id] ?? '').trim()))
  const toScripted = useCallback(() => { speak.stop(); setStage('scripted') }, [speak])

  const ear = useEar((text) => { const t = text.trim(); if (t) send(t) })
  const earRef = useRef(ear); earRef.current = ear
  const canHear = ear.supported && ear.state !== 'denied' && ear.state !== 'unsupported'

  // Val says her line, then the mic opens on its own.
  const valSays = useCallback((text: string, after?: () => void) => {
    const next = after ?? (() => { if (earRef.current.supported && earRef.current.state !== 'denied') earRef.current.start('chat') })
    if (quiet) { next(); return }
    speak.say(text, next)
  }, [quiet, speak])

  const turn = useCallback(async (history: Turn[]) => {
    setThinking(true)
    const c = authClient()
    const r: Reply = c ? await Promise.race([
      askVal(c, { kind: 'interview', questions: QS, answers: state.current.answers, turns: history }) as Promise<Reply>,
      new Promise<Reply>((res) => setTimeout(() => res({ unavailable: true }), 15000)),
    ]) : { unavailable: true }
    setThinking(false)
    if (r.unavailable || !r.say) { toScripted(); return }
    const merged = { ...state.current.answers, ...(r.answers ?? {}) }
    setAnswers(merged)
    const withVal = [...history, { who: 'val' as const, text: r.say }]
    setTurns(withVal)
    if (r.done) valSays(r.say, () => setStage('review'))
    else valSays(r.say)
  }, [toScripted, valSays])

  function send(text: string) {
    ear.stop(); speak.stop()
    const history = [...state.current.turns, { who: 'you' as const, text: text.slice(0, 800) }]
    setTurns(history); setTyped('')
    turn(history)
  }
  function begin() { setStage('talk'); turn(state.current.turns) }

  if (stage === 'scripted') return <ValInterview initial={answers} onDone={(a) => { clear(); onDone(a) }} onType={onType} startAt={firstMissing()} />
  if (stage === 'review') return <ValInterview initial={answers} onDone={(a) => { clear(); onDone(a) }} onType={onType} startReview />

  const got = QUESTIONS.filter((q) => (answers[q.id] ?? '').trim()).length
  const listening = ear.state === 'listening'

  /* ── Start ── */
  if (stage === 'start') return (
    <div className="flex-1 flex flex-col justify-center max-w-lg">
      <Badge speaking={false} />
      <h1 className="mt-6 font-display font-extrabold text-5xl sm:text-6xl tracking-[-0.03em] leading-[0.95]">Talk it through with Val.</h1>
      <p className="mt-4 text-xl text-[#141414]/70 leading-snug">A real conversation, about five minutes. She listens, asks what she needs to, and shows you what she took away before anything is saved.</p>
      {ear.checked && !ear.supported && <p className="mt-4 text-sm font-semibold text-ob">This browser can&rsquo;t listen. You can still talk to Val by typing.</p>}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button onClick={begin} className="bg-ob text-white rounded-full px-8 py-4 font-extrabold text-lg">{turns.length ? 'Pick up with Val' : 'Start with Val'}</button>
        <button onClick={() => onType(answers, 0)} className="border-2 border-[#141414] rounded-full px-8 py-4 font-extrabold">I&rsquo;d rather fill it in</button>
      </div>
      <p className="mt-4 text-sm text-[#141414]/50">Somewhere loud? You can type to her any time.</p>
    </div>
  )

  /* ── The conversation ── */
  return (
    <div className="flex-1 flex flex-col max-w-2xl w-full">
      <div className="flex items-center gap-3">
        <Badge speaking={speak.speaking} small />
        <div className="flex-1 min-w-0">
          <div className="text-xs tracking-[0.2em] uppercase font-extrabold text-ob">Val &middot; {got} of {QUESTIONS.length}</div>
          <ol className="mt-1.5 flex gap-1" aria-label={`${got} of ${QUESTIONS.length} answered`}>
            {QUESTIONS.map((q) => <li key={q.id} className={`h-1.5 flex-1 rounded-full transition-colors ${(answers[q.id] ?? '').trim() ? 'bg-ob' : 'bg-[#141414]/10'}`} />)}
          </ol>
        </div>
        <button onClick={() => { setQuiet(!quiet); if (!quiet) speak.stop() }} className="tap text-sm font-bold text-[#141414]/50 underline underline-offset-4 shrink-0">{quiet ? 'Sound on' : 'Mute Val'}</button>
      </div>

      <div className="mt-6 flex-1 grid content-start gap-3">
        {turns.map((t, n) => (
          <div key={n} className={`max-w-[85%] rounded-3xl px-5 py-3 text-lg leading-snug rise ${t.who === 'val' ? 'self-start justify-self-start bg-[#141414] text-white' : 'justify-self-end bg-white border-2 border-[#141414]/10'}`}>{t.text}</div>
        ))}
        {thinking && <div className="justify-self-start rounded-3xl px-5 py-3 bg-[#141414]/5 text-[#141414]/50"><span className="animate-pulse">Val&rsquo;s thinking&hellip;</span></div>}
        {listening && <div className="justify-self-end max-w-[85%] rounded-3xl px-5 py-3 border-2 border-dashed border-ob text-lg text-[#141414]/70"><span className="inline-block w-2 h-2 rounded-full bg-ob animate-pulse mr-2 align-middle" />{ear.live || 'Listening…'}</div>}
        <div ref={endRef} />
      </div>

      {ear.state === 'denied' && <p className="mt-3 text-sm font-semibold text-ob">Microphone is off for this site. Type to Val, or allow the mic in settings.</p>}

      <div className="mt-4 pt-3 border-t border-[#141414]/10 flex items-center gap-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {canHear && (listening ? (
          <button onClick={ear.stop} className="w-14 h-14 shrink-0 rounded-full bg-ob text-white grid place-items-center" aria-label="Done talking"><span className="w-4 h-4 rounded-sm bg-white" /></button>
        ) : (
          <button onClick={() => { speak.stop(); ear.start('chat') }} disabled={thinking} className="w-14 h-14 shrink-0 rounded-full bg-[#141414] text-white grid place-items-center disabled:opacity-40" aria-label="Talk">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
          </button>
        ))}
        <form className="flex-1 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (typed.trim() && !thinking) send(typed.trim()) }}>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Or type to Val" maxLength={800}
            className="flex-1 min-w-0 bg-white border-2 border-[#141414]/12 focus:border-ob outline-none rounded-full px-4 py-3 text-base" />
          <button disabled={!typed.trim() || thinking} className="bg-ob text-white rounded-full px-5 font-extrabold disabled:opacity-30">Send</button>
        </form>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 text-sm font-semibold text-[#141414]/50">
        {got > 0 && <button onClick={() => { speak.stop(); ear.stop(); setStage('review') }} className="tap underline underline-offset-4">See what Val has so far</button>}
        <button onClick={toScripted} className="tap underline underline-offset-4">Quick version instead</button>
      </div>
    </div>
  )
}

function clear() { try { localStorage.removeItem(KEY) } catch {} }

function Badge({ speaking, small }: { speaking: boolean; small?: boolean }) {
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
