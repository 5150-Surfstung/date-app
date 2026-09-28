'use client'

import { useEffect, useState } from 'react'
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

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero — takes on a /vibe every visit */}
      <section
        key={spin}
        className="px-6 sm:px-12 pb-16 transition-colors duration-700 vibe-in"
        style={{ background: vibe.bg, color: vibe.fg }}
      >
        <header className="flex items-center justify-between pt-8">
          <span className="font-display font-extrabold text-3xl tracking-tight">/date</span>
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline text-xs sm:text-sm tracking-[0.2em] uppercase font-medium" style={{ color: vibe.muted }}>
              {mine ? `Welcome back, /${mine}` : 'Charleston · Season I'}
            </span>
            <Link href="/login/" className="text-sm font-extrabold border-2 rounded-full px-4 py-1.5" style={{ borderColor: vibe.fg }}>
              {mine ? 'Inbox' : 'Log in'}
            </Link>
          </div>
        </header>

        <div className="pt-16 max-w-4xl">
          {venue && (
            <Link
              href={`/spot/${venue.slug}`}
              className="border-2 border-white bg-gold-faint rounded-2xl px-6 py-5 mb-12 max-w-lg block"
            >
              <div className="text-xs tracking-[0.2em] uppercase font-medium mb-2">
                You&rsquo;re at a /date spot
              </div>
              <div className="font-display font-extrabold text-3xl tracking-tight">{venue.name}</div>
              <div className="text-sm text-chalk-2 leading-relaxed mt-2">
                Scan in here. Someone in this room might be on /date. &rarr;
              </div>
            </Link>
          )}

          <div className="text-xs tracking-[0.2em] uppercase font-semibold mb-4" style={{ color: vibe.muted }}>
            Tonight&rsquo;s /vibe &middot; <span style={{ color: vibe.fg }}>/{vibe.tag}</span>
          </div>
          <h1 className="font-display font-extrabold text-6xl sm:text-8xl leading-[0.95] tracking-[-0.035em] [text-wrap:balance]">
            {vibe.headline}
          </h1>
          <p className="mt-8 text-lg sm:text-xl font-medium">
            Three matches. No games. Real people.
          </p>
          <p className="mt-6 max-w-xl text-xl sm:text-2xl leading-snug font-medium" style={{ color: vibe.muted }}>
            {vibe.sub}
          </p>

          <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-5">
            <Link
              href={ctaHref}
              className="text-lg font-extrabold rounded-full px-12 py-5 text-center hover:scale-[1.02] transition-transform"
              style={{ background: vibe.accent, color: vibe.onAccent }}
            >
              {vibe.cta}
            </Link>
            <Link
              href={ctaHref === '/claim' ? applyHref : '/claim'}
              className="border-2 text-lg font-extrabold rounded-full px-10 py-5 text-center hover:opacity-80 transition-opacity"
              style={{ borderColor: vibe.fg }}
            >
              {ctaHref === '/claim' ? 'Get your /vibe' : 'Claim your /name'}
            </Link>
            <button
              onClick={reroll}
              className="text-sm font-semibold underline underline-offset-4 self-start sm:self-auto"
              style={{ color: vibe.muted }}
            >
              Not my /vibe
            </button>
          </div>
        </div>
      </section>

      {/* The wall — the profiles, moving */}
      <section className="bg-[#141414] text-white py-12 overflow-hidden">
        <div className="px-6 sm:px-12 flex items-baseline justify-between gap-4 mb-6">
          <div className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ color: vibe.bg === '#141414' ? '#FF3B2F' : vibe.bg === '#FFF3EA' ? '#FF3B2F' : vibe.bg }}>
            On /date right now &middot; /{vibe.tag} first &middot; tap a face to send a /hey
          </div>
          <Link href="/demo" className="text-sm font-semibold underline underline-offset-4 text-white/60 hover:text-white">All {DEMO_CREW.length}</Link>
        </div>
        <Wall people={faces} direction="left" accent={accent} />
        <div className="h-3" />
        <Wall people={[...faces.slice(Math.ceil(faces.length / 2)), ...faces.slice(0, Math.ceil(faces.length / 2))]} direction="right" accent={accent} />
        <p className="px-6 sm:px-12 mt-6 text-xs text-white/40">Demo crew. Not real people &mdash; yet. Photos are generated.</p>
      </section>

      {/* Pick a word — white */}
      <section className="bg-white text-[#141414] px-6 sm:px-12 py-16">
        <div className="max-w-5xl">
          <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob mb-4">
            Pick a word. That&rsquo;s your /tag.
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {TAGS.map((t) => (
              <Link key={t.value} href="/claim" title={t.line}
                className="font-display font-extrabold text-4xl sm:text-6xl tracking-[-0.03em] hover:text-ob transition-colors">
                /{t.value}
              </Link>
            ))}
          </div>
          <p className="mt-5 text-base text-[#141414]/70 max-w-xl">
            It goes on your badge and your /hey page. Everyone knows what you&rsquo;re here for before a word is said. Change it any time.
          </p>
        </div>
      </section>

      {/* How it works — ink */}
      <section className="bg-[#141414] text-white px-6 sm:px-12 py-16">
        <div className="max-w-6xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {PROMISES.map((p) => (
              <div key={p.title}>
                <div className="font-display font-extrabold text-2xl mb-2 tracking-tight text-ob">{p.title}</div>
                <p className="text-base text-white/75 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob mb-4">
              Participating /spots
            </div>
            <div className="flex flex-wrap gap-3">
              {VENUES.map((v) => (
                <Link
                  key={v.slug}
                  href={`/spot/${v.slug}`}
                  className="border-2 border-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-white hover:text-[#141414] transition-colors"
                >
                  {v.name} · {v.area}
                </Link>
              ))}
              <span className="border-2 border-dashed border-white/40 rounded-full px-5 py-2.5 text-sm text-white/60">
                Your place? hello@surfstung.com
              </span>
            </div>
          </div>

          <p className="mt-12 text-sm text-white/50">/date · Matchmaking for humans · Val is the matchmaker · <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/terms" className="underline">Terms</Link></p>
        </div>
      </section>
    </main>
  )
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
