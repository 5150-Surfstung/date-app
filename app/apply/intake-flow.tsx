'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { QUESTIONS } from '@/lib/questions'
import { APPLICATIONS_TABLE, INTAKE_BUCKET } from '@/lib/supabase'
import { authClient, useSession } from '@/lib/auth'
import { SignIn } from '../gate'
import { VAL } from '@/lib/val'

const MIN_PHOTOS = 3
const MAX_PHOTOS = 10
const MAX_VOICE_SECONDS = 60

type Basics = {
  name: string
  age: string
  email: string
  phone: string
  neighborhood: string
  identity: string
  seeking: string
}

const EMPTY_BASICS: Basics = {
  name: '',
  age: '',
  email: '',
  phone: '',
  neighborhood: '',
  identity: '',
  seeking: '',
}

// Steps: 0 = basics, 1..QUESTIONS.length = questions, then photos, voice, done
const PHOTO_STEP = QUESTIONS.length + 1
const VOICE_STEP = QUESTIONS.length + 2
const TOTAL_STEPS = QUESTIONS.length + 3

export default function IntakeFlow() {
  const params = useSearchParams()
  const venue = params.get('v') ?? undefined

  const { session, email: me, loading: sessionLoading } = useSession()
  const [hasVibe, setHasVibe] = useState<boolean | null>(null)
  const [step, setStep] = useState(0)
  const [basics, setBasics] = useState<Basics>(EMPTY_BASICS)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<File[]>([])
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!me) return
    setBasics((b) => ({ ...b, email: me }))
    authClient()?.rpc('my_home').then(({ data }) => setHasVibe(Boolean(data?.vibe)))
  }, [me])

  const progress = Math.round((step / (TOTAL_STEPS - 1)) * 100)

  const basicsValid =
    basics.name.trim() &&
    Number(basics.age) >= 18 &&
    /.+@.+\..+/.test(basics.email) &&
    basics.identity &&
    basics.seeking

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const supabase = authClient()
      if (!supabase || !session) throw new Error('Sign in first.')

      // Your /vibe lives under your own user id; only you can write there.
      const id = session.user.id

      const photoKeys: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i]
        const ext = (p.name.split('.').pop() || 'jpg').toLowerCase()
        const key = `${id}/photo-${i}.${ext}`
        const { error: upErr } = await supabase.storage
          .from(INTAKE_BUCKET)
          .upload(key, p, { contentType: p.type || 'image/jpeg', upsert: true })
        if (upErr) throw new Error('Photo upload failed. Try again.')
        photoKeys.push(key)
      }

      let voiceKey: string | null = null
      if (voiceBlob) {
        const ext = voiceBlob.type.includes('mp4') ? 'mp4' : 'webm'
        voiceKey = `${id}/voice-note.${ext}`
        const { error: vErr } = await supabase.storage
          .from(INTAKE_BUCKET)
          .upload(voiceKey, voiceBlob, { contentType: voiceBlob.type || 'audio/webm', upsert: true })
        if (vErr) throw new Error('Voice upload failed. Try again.')
      }

      const { error: insErr } = await supabase.from(APPLICATIONS_TABLE).insert({
        id,
        venue_slug: venue ?? null,
        name: basics.name.trim(),
        age: Number(basics.age),
        email: me,
        phone: basics.phone.trim() || null,
        neighborhood: basics.neighborhood.trim() || null,
        identity: basics.identity,
        seeking: basics.seeking,
        answers,
        photo_keys: photoKeys,
        photo_count: photoKeys.length,
        voice_key: voiceKey,
        has_voice_note: Boolean(voiceKey),
        status: 'pending_review',
      })
      if (insErr) {
        throw new Error(
          insErr.code === '23505'
            ? 'You already have a /vibe. Edit it from /me.'
            : 'Could not save your application. Try again.'
        )
      }
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Shell progress={100}>
        <div className="flex-1 flex flex-col justify-center max-w-md">
          <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em] leading-tight [text-wrap:balance]">
            Your /vibe is in the pool.
          </h1>
          <p className="mt-6 text-2xl font-medium text-chalk-2 leading-snug">{VAL.applied} <span className="text-chalk-3">{VAL.sign}</span></p>
          <p className="mt-6 text-sm text-chalk-3 tracking-wide leading-relaxed">
            Profiles under 80% don&rsquo;t receive matches. Yours is complete.
          </p>
          <Link
            href="/claim"
            className="mt-10 self-start bg-white text-ob text-base font-extrabold rounded-full px-9 py-4 hover:scale-[1.02] transition-transform"
          >
            Now claim your /name
          </Link>
        </div>
      </Shell>
    )
  }

  if (!sessionLoading && !me) {
    return (
      <Shell progress={0}>
        <div className="flex-1 flex flex-col justify-center max-w-lg">
          <div className="text-xs tracking-[0.2em] uppercase font-medium mb-3">Your /vibe</div>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl tracking-[-0.03em] leading-[0.95] [text-wrap:balance]">Eight questions, your photos, sixty seconds of you.</h1>
          <p className="mt-5 text-xl text-chalk-2 font-medium leading-snug">It starts with your email, so your /vibe is only ever yours. Val sends a link; you land right back here.</p>
          <div className="mt-8"><SignIn cta="Start my /vibe" /></div>
        </div>
      </Shell>
    )
  }

  if (hasVibe) {
    return (
      <Shell progress={100}>
        <div className="flex-1 flex flex-col justify-center max-w-lg">
          <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em] leading-tight">Your /vibe is already in.</h1>
          <p className="mt-5 text-xl text-chalk-2 font-medium">Change anything, any time. Val reads the newest version.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/me/edit/" className="bg-white text-ob font-extrabold rounded-full px-8 py-4 text-center">Edit my /vibe</Link>
            <Link href="/me/" className="border-2 border-white font-extrabold rounded-full px-8 py-4 text-center">Go to /me</Link>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell progress={progress}>
      {step === 0 && (
        <StepFrame
          eyebrow="Before anything"
          title="The basics."
          onBack={undefined}
          onNext={basicsValid ? next : undefined}
        >
          <div className="grid gap-4 max-w-md">
            <Field
              label="First name"
              value={basics.name}
              onChange={(v) => setBasics({ ...basics, name: v })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Age"
                type="number"
                value={basics.age}
                onChange={(v) => setBasics({ ...basics, age: v })}
              />
              <Field
                label="Neighborhood"
                value={basics.neighborhood}
                onChange={(v) => setBasics({ ...basics, neighborhood: v })}
              />
            </div>
            <p className="text-sm text-chalk-3">Signed in as {me}.</p>
            <Field
              label="Phone (optional)"
              type="tel"
              value={basics.phone}
              onChange={(v) => setBasics({ ...basics, phone: v })}
            />
            <ChoiceRow
              label="I am"
              options={['Woman', 'Man', 'Nonbinary']}
              value={basics.identity}
              onChange={(v) => setBasics({ ...basics, identity: v })}
            />
            <ChoiceRow
              label="Seeking"
              options={['Women', 'Men', 'Everyone']}
              value={basics.seeking}
              onChange={(v) => setBasics({ ...basics, seeking: v })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Age from" type="number" value={answers.age_min ?? ''} onChange={(v) => setAnswers({ ...answers, age_min: v })} />
              <Field label="Age to" type="number" value={answers.age_max ?? ''} onChange={(v) => setAnswers({ ...answers, age_max: v })} />
            </div>
            {Number(basics.age) > 0 && Number(basics.age) < 18 && (
              <p className="text-sm text-gold">
                /date is for adults — 18 and over.
              </p>
            )}
          </div>
        </StepFrame>
      )}

      {step >= 1 && step <= QUESTIONS.length && (
        <QuestionStep
          index={step - 1}
          value={answers[QUESTIONS[step - 1].id] ?? ''}
          onChange={(v) =>
            setAnswers({ ...answers, [QUESTIONS[step - 1].id]: v })
          }
          onBack={back}
          onNext={
            (answers[QUESTIONS[step - 1].id] ?? '').trim() ? next : undefined
          }
        />
      )}

      {step === PHOTO_STEP && (
        <PhotoStep
          photos={photos}
          setPhotos={setPhotos}
          onBack={back}
          onNext={photos.length >= MIN_PHOTOS ? next : undefined}
        />
      )}

      {step === VOICE_STEP && (
        <VoiceStep
          voiceBlob={voiceBlob}
          setVoiceBlob={setVoiceBlob}
          onBack={back}
          onSubmit={voiceBlob ? submit : undefined}
          submitting={submitting}
          error={error}
        />
      )}
    </Shell>
  )
}

/* ── Layout chrome ── */

function Shell({
  progress,
  children,
}: {
  progress: number
  children: React.ReactNode
}) {
  return (
    <main className="min-h-dvh flex flex-col px-6 sm:px-10 pb-10">
      <header className="flex items-center justify-between pt-8 pb-6">
        <Link href="/" className="font-display font-extrabold text-gold text-3xl tracking-tight">
          /date
        </Link>
        <span className="text-sm tracking-[0.22em] uppercase text-chalk-3">
          Your /vibe
        </span>
      </header>
      <div className="h-px bg-ob-3 relative mb-10">
        <div
          className="absolute inset-y-0 left-0 bg-gold transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {children}
    </main>
  )
}

function StepFrame({
  eyebrow,
  title,
  children,
  onBack,
  onNext,
  nextLabel = 'Continue',
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
}) {
  return (
    <div className="flex-1 flex flex-col max-w-xl">
      <div className="text-xs tracking-[0.2em] uppercase text-chalk-3 mb-3">
        {eyebrow}
      </div>
      <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-[1.05] tracking-[-0.03em] [text-wrap:balance] mb-8">
        {title}
      </h1>
      <div className="flex-1">{children}</div>
      <div className="flex items-center gap-6 mt-10">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm tracking-[0.16em] uppercase text-chalk-3 hover:text-chalk-2"
          >
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!onNext}
          className="bg-white text-ob text-base font-extrabold rounded-full px-10 py-4 hover:scale-[1.02] transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}

/* ── Steps ── */

function QuestionStep({
  index,
  value,
  onChange,
  onBack,
  onNext,
}: {
  index: number
  value: string
  onChange: (v: string) => void
  onBack: () => void
  onNext?: () => void
}) {
  const q = QUESTIONS[index]
  return (
    <StepFrame
      eyebrow={`Question ${index + 1} of ${QUESTIONS.length}`}
      title={q.prompt}
      onBack={onBack}
      onNext={onNext}
    >
      {q.kind === 'choice' ? (
        <div className="grid gap-3 max-w-md">
          {q.options!.map((opt) => {
            const selected = value === opt
            return (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className={`flex items-start gap-3 text-left px-5 py-4 border-2 rounded-2xl transition-colors ${
                  selected
                    ? 'border-gold bg-gold-faint'
                    : 'border-ob-3 hover:border-ob-4 hover:bg-ob-2'
                }`}
              >
                <span
                  className={`mt-1 h-[11px] w-[11px] rounded-full border shrink-0 ${
                    selected ? 'border-gold bg-gold' : 'border-chalk-3'
                  }`}
                />
                <span className="text-base text-chalk-2 leading-relaxed">
                  {opt}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          rows={4}
          className="w-full max-w-md bg-ob-1 border-2 border-ob-3 rounded-xl focus:border-gold outline-none px-4 py-3.5 text-base text-chalk leading-relaxed placeholder:text-chalk-3/60 resize-none"
        />
      )}
    </StepFrame>
  )
}

function PhotoStep({
  photos,
  setPhotos,
  onBack,
  onNext,
}: {
  photos: File[]
  setPhotos: (f: File[]) => void
  onBack: () => void
  onNext?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previews = useMemo(
    () => photos.map((p) => URL.createObjectURL(p)),
    [photos]
  )

  function addFiles(list: FileList | null) {
    if (!list) return
    const merged = [...photos, ...Array.from(list)].slice(0, MAX_PHOTOS)
    setPhotos(merged)
  }

  return (
    <StepFrame
      eyebrow="Photos"
      title="Your life, not your angles."
      onBack={onBack}
      onNext={onNext}
    >
      <p className="text-base text-chalk-3 leading-relaxed max-w-md mb-6">
        {MIN_PHOTOS} to {MAX_PHOTOS} photos. Doing things you actually do, in
        places you actually go. They stay locked until your match is ready — the
        story comes first.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => addFiles(e.target.files)}
      />
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-md">
        {previews.map((src, i) => (
          <div key={i} className="relative aspect-square border-2 border-ob-3 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1 right-1 h-5 w-5 bg-ob/80 text-chalk-2 text-sm leading-5"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            onClick={() => inputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-ob-4 rounded-xl text-chalk-3 text-2xl font-light hover:border-gold hover:text-gold transition-colors"
            aria-label="Add photos"
          >
            +
          </button>
        )}
      </div>
      <p className="mt-4 text-sm text-chalk-3 tracking-wide">
        {photos.length} of {MIN_PHOTOS} minimum
      </p>
    </StepFrame>
  )
}

function VoiceStep({
  voiceBlob,
  setVoiceBlob,
  onBack,
  onSubmit,
  submitting,
  error,
}: {
  voiceBlob: Blob | null
  setVoiceBlob: (b: Blob | null) => void
  onBack: () => void
  onSubmit?: () => void
  submitting: boolean
  error: string | null
}) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [unsupported, setUnsupported] = useState(false)
  const recRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioUrl = useMemo(
    () => (voiceBlob ? URL.createObjectURL(voiceBlob) : null),
    [voiceBlob]
  )

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      rec.ondataavailable = (e) => chunks.push(e.data)
      rec.onstop = () => {
        setVoiceBlob(new Blob(chunks, { type: rec.mimeType }))
        stream.getTracks().forEach((t) => t.stop())
      }
      rec.start()
      recRef.current = rec
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_VOICE_SECONDS) stop()
          return s + 1
        })
      }, 1000)
    } catch {
      setUnsupported(true)
    }
  }

  function stop() {
    recRef.current?.stop()
    recRef.current = null
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  return (
    <StepFrame
      eyebrow="Last thing"
      title="Sixty seconds, unscripted."
      onBack={onBack}
      onNext={onSubmit}
      nextLabel={submitting ? "Submitting…" : "Send my /vibe"}
    >
      <p className="text-base text-chalk-3 leading-relaxed max-w-md mb-8">
        Talk about anything — your week, the thing you can&rsquo;t stop thinking
        about, what a good Sunday sounds like. Your match hears this before they
        see a single photo. It&rsquo;s the most honest thing in your profile, and
        it can&rsquo;t be faked.
      </p>

      {unsupported ? (
        <p className="text-base text-gold max-w-md">
          We couldn&rsquo;t reach your microphone. Allow mic access, or finish
          this step later from the link in your email.
        </p>
      ) : (
        <div className="flex items-center gap-6">
          {!recording && !voiceBlob && (
            <button
              onClick={start}
              className="h-20 w-20 rounded-full border border-gold text-gold text-xs tracking-[0.14em] uppercase hover:bg-gold-faint transition-colors"
            >
              Record
            </button>
          )}
          {recording && (
            <>
              <button
                onClick={stop}
                className="h-20 w-20 rounded-full border border-gold bg-gold-faint text-gold text-xs tracking-[0.14em] uppercase"
              >
                Stop
              </button>
              <span className="text-lg text-chalk tabular-nums">
                0:{String(seconds).padStart(2, '0')} / 1:00
              </span>
            </>
          )}
          {voiceBlob && !recording && (
            <div className="flex flex-col gap-3">
              <audio controls src={audioUrl ?? undefined} className="max-w-xs" />
              <button
                onClick={() => setVoiceBlob(null)}
                className="self-start text-sm tracking-[0.16em] uppercase text-chalk-3 hover:text-chalk-2"
              >
                Re-record
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-6 text-base text-gold max-w-md">{error}</p>}
    </StepFrame>
  )
}

/* ── Form primitives ── */

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs tracking-[0.18em] uppercase text-chalk-3">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-ob-1 border-2 border-ob-3 rounded-xl focus:border-gold outline-none px-4 py-3 text-base text-chalk"
      />
    </label>
  )
}

function ChoiceRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs tracking-[0.18em] uppercase text-chalk-3">
        {label}
      </span>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-5 py-2.5 border-2 rounded-full text-sm transition-colors ${
              value === opt
                ? 'border-gold bg-gold-faint text-chalk'
                : 'border-ob-3 text-chalk-2 hover:border-ob-4'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
