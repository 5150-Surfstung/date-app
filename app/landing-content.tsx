'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { VENUES, getVenue } from '@/lib/venues'
import { TAGS, HANDLE_KEY, type Tag } from '@/lib/handles'
import { DEMO_CREW, demoPhoto } from '@/lib/demo'
import { VIBES, pickVibe, vibeFor, type VibeTheme } from '@/lib/vibes'
import { getSupabase } from '@/lib/supabase'


const PROMISES = [
  {
    title: 'Your /vibe is your profile',
    body: 'Eight real questions, your photos, and sixty seconds of your voice. Verified, every one. No bots, no games.',
  },
  {
    title: 'Your /name',
    body: 'Give it out instead of your number. Anyone with it can send you a /hey. Val shows you their /vibe first; they hear nothing until you say yes.',
  },
  {
    title: '/spots',
    body: 'Scan in at a participating spot. Someone in the room might be on /date too. If it’s mutual, Val introduces you. Nobody has to walk over.',
  },
  {
    title: '/nights',
    body: 'One night a month at every /spot. A room full of verified singles, first hour comped, introductions made live.',
  },
]

// Profiles for the homepage: same /tag first, then everyone else.
function facesFor(tag: Tag) {
  const same = DEMO_CREW.filter((d) => d.tag === tag)
  const rest = DEMO_CREW.filter((d) => d.tag !== tag)
  return [...same, ...rest]
}

export default function LandingContent() {
  const params = useSearchParams()
  const slug = params.get('v') ?? undefined
  const venue = slug ? getVenue(slug) : undefined
  const applyHref = slug ? `/apply?v=${encodeURIComponent(slug)}` : '/apply'

  const [vibe, setVibe] = useState<VibeTheme>(VIBES[0])
  const [mine, setMine] = useState<string | null>(null)
  const [spin, setSpin] = useState(0)
  const [receipts, setReceipts] = useState<{ pool: number; founding: number; intros: number; second_rate: number | null } | null>(null)
  useEffect(() => { getSupabase()?.rpc('date_receipts').then(({ data }) => setReceipts(data)) }, [])

  // First paint: your own /tag if you have a /name, otherwise the moment's.
  useEffect(() => {
    let handle: string | null = null
    try { handle = localStorage.getItem(HANDLE_KEY) } catch {}
    if (!handle) { setVibe(pickVibe()); return }
    setMine(handle)
    getSupabase()?.rpc('handle_wall', { p_handle: handle }).then(({ data }) => {
      setVibe(data?.tag ? vibeFor(data.tag) : pickVibe())
    })
  }, [])

  function reroll() {
    setSpin((n) => n + 1)
    setVibe(pickVibe(vibe.tag))
  }

  const faces = facesFor(vibe.tag)
  const accent = ['#141414', '#FFF3EA', '#140A20', '#1F3D2B', '#0E7C7B'].includes(vibe.bg) ? '#FF3B2F' : vibe.bg
  const ctaHref =
    vibe.tag === 'fun' ? `/spot/${VENUES[0].slug}` :
    vibe.tag === 'tonight' || vibe.tag === 'open' || vibe.tag === 'casual' ? '/claim' : applyHref

  // Auto-cycle /vibes in the hero until you scroll or it's yours.
  const [auto, setAuto] = useState(true)
  useEffect(() => {
    if (mine || !auto) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => { if (!document.hidden && window.scrollY < window.innerHeight * 0.5) setVibe((v) => nextVibe(v)) }, CYCLE)
    return () => clearTimeout(t)
  }, [vibe, mine, auto])

  // The page is one continuous piece: full-screen scenes, and the color
  // behind them morphs from one to the next as you scroll.
  const SCENES = [
    { bg: vibe.bg, fg: vibe.fg, name: 'Top' },
    { bg: '#141414', fg: '#FFFFFF', name: 'Who’s on' },
    { bg: '#FFF3EA', fg: '#141414', name: 'Watch Val work' },
    { bg: '#FF3B2F', fg: '#FFFFFF', name: 'Your /tags' },
    { bg: '#141414', fg: '#FFFFFF', name: 'How it works' },
    { bg: vibe.bg, fg: vibe.fg, name: 'Get in' },
  ]
  const morph = useMorph(SCENES)
  const tagColor = vibe.bg === '#141414' || vibe.bg === '#FFF3EA' ? '#FF3B2F' : vibe.bg
  const words = vibe.headline.split(' ')

  return (
    <main ref={morph.root} className="relative overflow-x-clip">
      <div ref={morph.backdrop} aria-hidden className="fixed inset-0 z-0" style={{ background: vibe.bg }} />
      <div aria-hidden className="grain fixed inset-0 z-20 pointer-events-none" />

      <header ref={morph.header} className="fixed top-0 inset-x-0 z-30 px-6 sm:px-12 pt-[max(1.5rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between pointer-events-none" style={{ color: vibe.fg }}>
        <button onClick={() => morph.go(0)} className="font-display font-extrabold text-3xl tracking-tight pointer-events-auto">/date</button>
        <div className="flex items-center gap-5 pointer-events-auto">
          <span className="hidden sm:inline text-xs sm:text-sm tracking-[0.2em] uppercase font-medium opacity-70">
            {mine ? `Welcome back, /${mine}` : 'Charleston · Season I'}
          </span>
          <Link href="/login/" className="text-sm font-extrabold border-2 border-current rounded-full px-4 py-2.5">
            {mine ? 'Inbox' : 'Log in'}
          </Link>
        </div>
      </header>

      <nav aria-label="Sections" className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1" style={{ color: morph.fg }}>
        {SCENES.map((sc, i) => (
          <button key={i} onClick={() => morph.go(i)} aria-label={sc.name} aria-current={morph.active === i}
            className="grid place-items-center w-7 h-7">
            <span className={`block w-2 rounded-full bg-current transition-all duration-500 ${morph.active === i ? 'h-6' : 'h-2 opacity-40'}`} />
          </button>
        ))}
      </nav>

      {/* 1 · Hero — /vibes cycle on their own; a glow follows your finger */}
      <section data-scene="0" className="scene relative z-10 px-6 sm:px-12 pt-32 pb-20 overflow-hidden" style={{ color: vibe.fg }}
        onPointerMove={(e) => morph.glow(e)} onPointerDown={() => setAuto(false)}>
        <div ref={morph.orb} aria-hidden className="orb" style={{ background: vibe.accent === vibe.fg ? '#FFD23F' : vibe.accent }} />
        <div className="relative max-w-4xl">
          {venue && (
            <Link href={`/spot/${venue.slug}`} className="rise border-2 border-current rounded-2xl px-6 py-5 mb-12 max-w-lg block">
              <div className="text-xs tracking-[0.2em] uppercase font-medium mb-2">You&rsquo;re at a /date spot</div>
              <div className="font-display font-extrabold text-3xl tracking-tight">{venue.name}</div>
              <div className="text-sm leading-relaxed mt-2 opacity-80">Scan in here. Someone in this room might be on /date. &rarr;</div>
            </Link>
          )}
          <div className="rise text-xs tracking-[0.2em] uppercase font-semibold" style={{ color: vibe.muted }}>
            {mine ? 'Your /vibe' : 'Tonight’s /vibe'} &middot; <span key={vibe.tag} className="swap-in inline-block" style={{ color: vibe.fg }}>/{vibe.tag}</span>
          </div>
          {!mine && auto && <div key={`bar-${vibe.tag}-${spin}`} className="cycle-bar mt-3 h-[3px] w-36 rounded-full" style={{ background: vibe.muted }} />}
          <h1 key={`h-${vibe.tag}-${spin}`} className="mt-6 font-display font-extrabold text-[3.6rem] sm:text-8xl leading-[0.95] tracking-[-0.04em] [text-wrap:balance]">
            {words.map((w, i) => (
              <Fragment key={i}><span className="word"><span style={{ animationDelay: `${i * 70}ms` }}>{w}</span></span>{i < words.length - 1 ? ' ' : ''}</Fragment>
            ))}
          </h1>
          <p className="rise mt-8 text-lg sm:text-xl font-semibold" style={{ ['--d' as string]: 2 }}>Three matches. No games. Real people.</p>
          <p key={`s-${vibe.tag}`} className="swap-in mt-4 max-w-xl text-lg sm:text-2xl leading-snug font-medium" style={{ color: vibe.muted }}>{vibe.sub}</p>
          <div className="rise mt-10 flex flex-col sm:flex-row sm:items-center gap-4" style={{ ['--d' as string]: 4 }}>
            <Link href={ctaHref} className="shine text-lg font-extrabold rounded-full px-12 py-5 text-center active:scale-[0.97] transition-transform"
              style={{ background: vibe.accent, color: vibe.onAccent }}>
              {vibe.cta}
            </Link>
            <Link href={ctaHref === '/claim' ? applyHref : '/claim'} className="border-2 border-current text-lg font-extrabold rounded-full px-10 py-5 text-center active:scale-[0.97] transition-transform">
              {ctaHref === '/claim' ? 'Get your /vibe' : 'Claim your /name'}
            </Link>
            <button onClick={() => { setAuto(false); reroll() }} className="tap text-sm font-semibold underline underline-offset-4 self-start sm:self-auto" style={{ color: vibe.muted }}>
              Not my /vibe
            </button>
          </div>
        </div>
        <button onClick={() => morph.go(1)} aria-label="Next" className="scroll-cue absolute bottom-6 left-1/2 text-2xl opacity-60">&darr;</button>
      </section>

      {/* 2 · The wall — leans into your swipe */}
      <section data-scene="1" className="scene relative z-10 text-white pt-28 pb-16 overflow-hidden flex flex-col justify-center">
        <div className="rise px-6 sm:px-12 flex items-baseline justify-between gap-4 mb-6 pr-12">
          <div className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ color: tagColor }}>
            On /date right now &middot; /{vibe.tag} first &middot; tap a face
          </div>
          <Link href="/demo" className="text-sm font-semibold underline underline-offset-4 text-white/60 hover:text-white px-3 -mx-3 shrink-0">All {DEMO_CREW.length}</Link>
        </div>
        <div className="skew">
          <div className="rise" style={{ ['--d' as string]: 1 }}><Wall people={faces} direction="left" accent={accent} /></div>
          <div className="h-3" />
          <div className="rise" style={{ ['--d' as string]: 2 }}><Wall people={[...faces.slice(Math.ceil(faces.length / 2)), ...faces.slice(0, Math.ceil(faces.length / 2))]} direction="right" accent={accent} /></div>
        </div>
        <p className="rise px-6 sm:px-12 mt-6 text-xs text-white/40" style={{ ['--d' as string]: 3 }}>Demo crew. Not real people &mdash; yet. Photos are generated.</p>
      </section>

      {/* 3 · Val makes an intro, live */}
      <section data-scene="2" className="scene relative z-10 text-[#141414] px-6 sm:px-12 pt-28 pb-16 flex flex-col justify-center">
        <div className="max-w-xl w-full pr-6">
          <div className="rise text-xs tracking-[0.2em] uppercase font-semibold text-ob">Watch Val work</div>
          <h2 className="rise mt-3 font-display font-extrabold text-5xl sm:text-6xl leading-[0.95] tracking-[-0.04em]" style={{ ['--d' as string]: 1 }}>No swiping. She just knows.</h2>
          <div className="rise" style={{ ['--d' as string]: 2 }}><ValIntro /></div>
        </div>
      </section>

      {/* 4 · Pick your /tags */}
      <section data-scene="3" className="scene relative z-10 text-white px-6 sm:px-12 pt-28 pb-16 flex flex-col justify-center">
        <div className="max-w-5xl pr-8"><TagScene /></div>
      </section>

      {/* 5 · How it works — the cards stack as you go */}
      <section data-scene="4" className="relative z-10 text-white px-4 sm:px-12 pt-28 pb-24" style={{ scrollSnapAlign: 'start' }}>
        <div className="max-w-3xl mx-auto">
          <div className="rise px-2 text-xs tracking-[0.2em] uppercase font-semibold text-ob mb-6">How /date works</div>
          {PROMISES.map((p, i) => (
            <div key={p.title} className="stack-card sticky" style={{ top: `calc(6.5rem + ${i * 18}px)`, zIndex: i }}>
              <div className="rounded-[28px] p-7 sm:p-10 min-h-[58vh] flex flex-col shadow-[0_-24px_48px_rgba(0,0,0,0.35)]" style={{ background: CARD_COLORS[i][0], color: CARD_COLORS[i][1] }}>
                <div className="font-display font-extrabold text-7xl leading-none tabular-nums" style={{ color: CARD_COLORS[i][2] }}>0{i + 1}</div>
                <div className="font-display font-extrabold text-4xl sm:text-5xl tracking-[-0.035em] mt-4">{p.title}</div>
                <p className="mt-5 text-lg sm:text-xl leading-relaxed opacity-80 max-w-xl">{p.body}</p>
              </div>
              <div className="h-8" />
            </div>
          ))}
        </div>
      </section>

      {/* 6 · Receipts count up, then the ask */}
      <section data-scene="5" className="scene relative z-10 px-6 sm:px-12 pt-28 pb-12 flex flex-col justify-center overflow-hidden" style={{ color: vibe.fg }}>
        <div aria-hidden className="giant">/date /date /date /date&nbsp;</div>
        <div className="relative max-w-5xl pr-8">
          <div className="rise text-xs tracking-[0.2em] uppercase font-semibold mb-4" style={{ color: vibe.muted }}>/receipts &middot; live</div>
          <div className="rise grid grid-cols-2 sm:flex sm:flex-wrap gap-x-10 gap-y-5" style={{ ['--d' as string]: 1 }}>
            <Stat n={receipts?.pool} label="in the pool" muted={vibe.muted} />
            <Stat n={receipts?.founding} suffix="/500" label="founding" muted={vibe.muted} />
            <Stat n={receipts?.intros} label="introductions" muted={vibe.muted} />
            <Stat n={receipts?.second_rate ?? undefined} suffix="%" label="went to a /second" muted={vibe.muted} />
          </div>

          <h2 className="rise mt-14 font-display font-extrabold text-6xl sm:text-8xl leading-[0.92] tracking-[-0.045em]" style={{ ['--d' as string]: 2 }}>
            Val&rsquo;s ready when you are.
          </h2>
          <div className="rise mt-8 flex flex-col sm:flex-row gap-4" style={{ ['--d' as string]: 3 }}>
            <Link href={applyHref} className="shine text-lg font-extrabold rounded-full px-12 py-5 text-center active:scale-[0.97] transition-transform"
              style={{ background: vibe.accent, color: vibe.onAccent }}>Get your /vibe</Link>
            <Link href="/founding" className="border-2 border-current text-lg font-extrabold rounded-full px-10 py-5 text-center">The first 500</Link>
          </div>

          <div className="rise mt-14" style={{ ['--d' as string]: 4 }}>
            <div className="text-xs tracking-[0.2em] uppercase font-semibold mb-4" style={{ color: vibe.muted }}>Participating /spots</div>
            <div className="flex flex-wrap gap-3">
              {VENUES.map((v) => (
                <span key={v.slug} className="flex gap-2">
                  <Link href={`/spot/${v.slug}`} className="border-2 border-current rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-70 transition-opacity">
                    {v.name} · {v.area}
                  </Link>
                  {v.night && (
                    <Link href={`/night/${v.slug}`} className="bg-[#FF5CA8] text-[#140A20] rounded-full px-5 py-2.5 text-sm font-extrabold">
                      /night · {v.night.when.split(' · ')[0]}
                    </Link>
                  )}
                </span>
              ))}
              <span className="border-2 border-dashed border-current rounded-full px-5 py-2.5 text-sm opacity-60">Your place? hello@surfstung.com</span>
            </div>
          </div>

          <p className="mt-14 text-sm" style={{ color: vibe.muted }}>
            /date · Matchmaking for humans · Val is the matchmaker · <Link href="/receipts" className="underline">All the numbers</Link> · <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/terms" className="underline">Terms</Link>
          </p>
        </div>
      </section>
    </main>
  )
}

const CYCLE = 4500
function nextVibe(v: VibeTheme) {
  const i = VIBES.findIndex((x) => x.tag === v.tag)
  return VIBES[(i + 1) % VIBES.length]
}

// bg, text, number
const CARD_COLORS: [string, string, string][] = [
  ['#FFF3EA', '#141414', '#FF3B2F'],
  ['#FF3B2F', '#FFFFFF', '#141414'],
  ['#FFFFFF', '#141414', '#FF3B2F'],
  ['#FF5CA8', '#140A20', '#FFFFFF'],
]

// Counts up from zero the first time it comes into view.
function Stat({ n, suffix = '', label, muted }: { n?: number; suffix?: string; label: string; muted: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState<number | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || n == null) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(n); return }
      const t0 = performance.now()
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1400)
        setShown(Math.round(n * (1 - Math.pow(1 - k, 3))))
        if (k < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [n])
  return (
    <div ref={ref}>
      <div className="font-display font-extrabold text-5xl sm:text-6xl tabular-nums leading-none">
        {n == null ? '—' : (shown ?? 0)}<span className="text-2xl opacity-60">{n == null ? '' : suffix}</span>
      </div>
      <div className="text-xs tracking-[0.15em] uppercase mt-1" style={{ color: muted }}>{label}</div>
    </div>
  )
}

// Tap up to three words. The first leads. They ride along to /claim.
function TagScene() {
  const [picked, setPicked] = useState<Tag[]>([])
  const [nope, setNope] = useState(0)
  const toggle = (t: Tag) => {
    if (picked.includes(t)) { setPicked(picked.filter((x) => x !== t)); return }
    if (picked.length >= 3) { setNope((n) => n + 1); try { navigator.vibrate?.([12, 40, 12]) } catch {} ; return }
    try { navigator.vibrate?.(8) } catch {}
    setPicked([...picked, t])
  }
  const lead = TAGS.find((t) => t.value === picked[0])
  const href = picked.length ? `/claim?tags=${picked.join(',')}` : '/claim'
  return (
    <>
      <div className="rise text-xs tracking-[0.2em] uppercase font-semibold text-white/85 mb-5">Pick up to three. First one leads.</div>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {TAGS.map((t, i) => {
          const at = picked.indexOf(t.value)
          return (
            <button key={t.value} onClick={() => toggle(t.value)} aria-pressed={at >= 0} title={t.line}
              className={`rise tag-word font-display font-extrabold text-5xl sm:text-7xl tracking-[-0.035em] leading-[1.05] ${at >= 0 ? 'is-on' : ''}`}
              style={{ ['--d' as string]: 1 + i * 0.5, color: at === 0 ? '#141414' : at > 0 ? '#FFFFFF' : 'rgba(255,255,255,0.38)' }}>
              /{t.value}
              {at >= 0 && <sup className="text-base align-super ml-1 tabular-nums">{at + 1}</sup>}
            </button>
          )
        })}
      </div>
      <p key={`${picked[0]}-${nope}`} className={`mt-8 min-h-[1.75rem] text-lg font-semibold ${nope ? 'shake' : 'swap-in'}`}>
        {nope && picked.length >= 3 ? 'Three max. Tap one to drop it.' : lead ? `/${lead.value}: ${lead.line}` : 'Tap the words that sound like you.'}
      </p>
      <Link href={href} className="rise shine mt-6 inline-block bg-[#141414] text-white text-lg font-extrabold rounded-full px-10 py-5 text-center active:scale-[0.97] transition-transform" style={{ ['--d' as string]: 6 }}>
        {picked.length ? `Claim your /name with ${picked.map((x) => '/' + x).join(' ')}` : 'Claim your /name'}
      </Link>
    </>
  )
}

// A looping demo of the product's core moment: Val picks two people, says why,
// and books the table. Runs only while on screen.
const PAIRS: [string, string, string][] = [
  ['sloane', 'nico', 'You both said the best nights aren’t planned.'],
  ['lena', 'tasha', 'You both want the real thing and said so out loud.'],
  ['marcus', 'reid', 'Neither of you is in a rush. Good.'],
  ['theo', 'kenji', 'You’re both honest about not knowing yet. That’s rare.'],
  ['mateo', 'jules', 'One of you knows this city. One of you wants to.'],
  ['noor', 'sienna', 'Same bookstore, same bad jokes. Trust me.'],
]
const WHEN = ['Thursday, 7:30', 'Friday, 8:00', 'Saturday, 6:45', 'Wednesday, 7:00']

function ValIntro() {
  const ref = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(0)
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState(0)
  const [pct, setPct] = useState(0)
  const [live, setLive] = useState(false)

  const [ha, hb, why] = PAIRS[k % PAIRS.length]
  const a = DEMO_CREW.find((d) => d.handle === ha)!
  const b = DEMO_CREW.find((d) => d.handle === hb)!
  const venue = VENUES[k % VENUES.length]
  const line = `/${a.handle}, meet /${b.handle}. ${why} ${WHEN[k % WHEN.length]} at ${venue.name}. I’ve got the table.`
  const target = 86 + ((ha.length * 7 + hb.length * 3 + k) % 12)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!live) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(3); setPct(target); setTyped(line.length)
      const t = setTimeout(() => setK((x) => x + 1), 6000)
      return () => clearTimeout(t)
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    let raf = 0
    setStep(0); setTyped(0); setPct(0)
    timers.push(setTimeout(() => setStep(1), 250))
    timers.push(setTimeout(() => {
      setStep(2)
      const t0 = performance.now()
      const tick = (t: number) => {
        const q = Math.min(1, (t - t0) / 1100)
        setPct(Math.round(target * (1 - Math.pow(1 - q, 3))))
        if (q < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, 1150))
    timers.push(setTimeout(() => {
      setStep(3)
      let n = 0
      const type = () => { n += 1; setTyped(n); if (n < line.length) timers.push(setTimeout(type, 24)) }
      type()
    }, 2500))
    timers.push(setTimeout(() => setK((x) => x + 1), 2500 + line.length * 24 + 2800))
    return () => { timers.forEach(clearTimeout); cancelAnimationFrame(raf) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, live])

  return (
    <div ref={ref} className="mt-8" data-step={step}>
      <div className="relative h-[300px] sm:h-[340px]">
        {[a, b].map((p, side) => (
          <Link key={p.handle + k} href={`/${p.handle}`} className={`intro-card ${side ? 'is-right' : 'is-left'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={demoPhoto(p.handle)} alt={`${p.name}, ${p.age}`} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
            <div className="absolute left-3 bottom-3 text-white">
              <div className="font-display font-extrabold text-xl leading-none">/{p.handle}</div>
              <div className="text-xs font-semibold mt-1 text-white/80">{p.name}, {p.age} · {p.hood}</div>
            </div>
          </Link>
        ))}
        <div className="intro-badge" aria-live="polite">
          <div className="font-display font-extrabold text-3xl tabular-nums leading-none">{pct}%</div>
          <div className="text-[10px] font-bold tracking-[0.14em] uppercase mt-1">chemistry</div>
        </div>
      </div>
      <div className="intro-bubble rounded-3xl bg-[#141414] text-white p-5 min-h-[7.5rem]">
        <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.14em] uppercase text-ob">
          <span className="val-dot" />Val
        </div>
        <p className="mt-2 text-[17px] leading-snug font-semibold">
          {line.slice(0, typed)}<span className={`caret ${step === 3 && typed < line.length ? '' : 'opacity-0'}`}>|</span>
        </p>
      </div>
      <p className="mt-3 text-xs text-[#141414]/45">Demo crew, real flow. Every intro comes with a reason and a table.</p>
    </div>
  )
}

// Scroll-driven morph. The backdrop and header colors are blended between the
// scene you're leaving and the one coming in, frame by frame, so the page
// changes under your finger instead of cutting. Scenes rise in as they arrive,
// and the photo wall leans with how fast you swipe.
function useMorph(scenes: { bg: string; fg: string }[]) {
  const root = useRef<HTMLElement>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLElement>(null)
  const orb = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const key = scenes.map((s) => s.bg + s.fg).join()

  useEffect(() => {
    const el = root.current
    if (!el) return
    const nodes = Array.from(el.querySelectorAll<HTMLElement>('[data-scene]'))
    document.documentElement.classList.add('snap')
    el.classList.add('js-reveal')
    // A /vibe change (not a scroll) eases the color instead of snapping it.
    const eased = [backdrop.current, header.current]
    eased.forEach((n) => n?.classList.add('ease-color'))
    const unEase = setTimeout(() => eased.forEach((n) => n?.classList.remove('ease-color')), 900)

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) e.target.setAttribute('data-on', '')
    }, { threshold: 0.15 })
    nodes.forEach((n) => io.observe(n))

    let frame = 0
    let last = -1
    let lastY = window.scrollY
    let skew = 0
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const paint = () => {
      frame = 0
      const vh = window.innerHeight
      let i = 0
      nodes.forEach((n, k) => { if (n.getBoundingClientRect().top <= vh * 0.4) i = k })
      const next = nodes[i + 1]
      const t = next ? Math.min(1, Math.max(0, (vh - next.getBoundingClientRect().top) / (vh * 0.6))) : 0
      const a = scenes[i], b = scenes[Math.min(i + 1, scenes.length - 1)]
      if (backdrop.current) backdrop.current.style.background = mix(a.bg, b.bg, t)
      if (header.current) header.current.style.color = mix(a.fg, b.fg, t)
      const now = t > 0.5 ? i + 1 : i
      if (now !== last) { last = now; setActive(now) }

      // Swipe speed → lean, easing back to flat.
      const y = window.scrollY
      const target = still ? 0 : Math.max(-7, Math.min(7, (y - lastY) * 0.18))
      lastY = y
      skew += (target - skew) * 0.25
      if (Math.abs(skew) < 0.02) skew = 0
      el.style.setProperty('--skew', `${skew.toFixed(2)}deg`)
      if (skew !== 0) frame = requestAnimationFrame(paint)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(paint) }
    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      io.disconnect()
      clearTimeout(unEase)
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      document.documentElement.classList.remove('snap')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const go = (i: number) => root.current?.querySelector(`[data-scene="${i}"]`)?.scrollIntoView({ behavior: 'smooth' })
  const glow = (e: React.PointerEvent<HTMLElement>) => {
    const o = orb.current
    if (!o) return
    const r = e.currentTarget.getBoundingClientRect()
    o.style.setProperty('--x', `${e.clientX - r.left}px`)
    o.style.setProperty('--y', `${e.clientY - r.top}px`)
    o.classList.add('is-held')
  }
  return { root, backdrop, header, orb, active, go, glow, fg: scenes[active]?.fg }
}

function hex(c: string): [number, number, number] {
  const h = c.replace('#', '')
  const f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h.slice(0, 6)
  return [0, 2, 4].map((k) => parseInt(f.slice(k, k + 2), 16)) as [number, number, number]
}
function mix(a: string, b: string, t: number) {
  if (t <= 0 || a === b) return a
  if (t >= 1) return b
  const x = hex(a), y = hex(b)
  return `rgb(${x.map((v, k) => Math.round(v + (y[k] - v) * t)).join(',')})`
}

function Wall({ people, direction, accent }: { people: typeof DEMO_CREW; direction: 'left' | 'right'; accent: string }) {
  const row = [...people, ...people]
  return (
    <div className="wall-track" style={{ animationDirection: direction === 'left' ? 'normal' : 'reverse' }}>
      {row.map((d, i) => (
        <Link key={d.handle + i} href={`/${d.handle}`} className="wall-card group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={demoPhoto(d.handle)} alt={`${d.name}, ${d.age}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="font-display font-extrabold text-3xl leading-none tracking-[-0.03em]">/{d.handle}</div>
            <div className="font-display font-extrabold text-2xl leading-none tracking-[-0.03em] mt-1" style={{ color: accent }}>/{d.tag}</div>
            <div className="text-sm font-semibold mt-2 text-white/85">{d.name}, {d.age} &middot; {d.hood}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
