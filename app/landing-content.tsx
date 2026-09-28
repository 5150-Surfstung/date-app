'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const VENUES: Record<string, { name: string; area: string; perk: string }> = {
  'golden-hour': {
    name: 'Golden Hour Coffee',
    area: 'East Nashville',
    perk: 'First dates here get the corner table and a round on the house.',
  },
}

const PROMISES = [
  {
    title: 'Real people only',
    body: 'Every profile is voice and photo verified. No bots, no tourists, no games.',
  },
  {
    title: 'Three matches a season',
    body: 'Hand-picked for you, each with a reason. You meet the person before the photos.',
  },
  {
    title: 'The date is handled',
    body: 'A great spot, a table held, and a brief on what matters to them. You just show up.',
  },
]

export default function LandingContent() {
  const params = useSearchParams()
  const slug = params.get('v') ?? undefined
  const venue = slug ? VENUES[slug] : undefined
  const applyHref = slug ? `/apply?v=${encodeURIComponent(slug)}` : '/apply'

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-12 pt-8">
        <span className="font-display font-bold italic text-gold text-3xl">/date</span>
        <span className="text-xs sm:text-sm tracking-[0.2em] uppercase text-chalk-2 font-medium">
          Season I
        </span>
      </header>

      <section className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-16 max-w-4xl">
        {venue && (
          <div className="border-2 border-gold bg-gold-faint px-6 py-5 mb-12 max-w-lg">
            <div className="text-xs tracking-[0.2em] uppercase text-gold font-medium mb-2">
              You scanned in at
            </div>
            <div className="font-display font-bold text-3xl text-chalk">{venue.name}</div>
            <div className="text-sm text-chalk-2 leading-relaxed mt-2">
              {venue.area} · {venue.perk}
            </div>
          </div>
        )}

        <h1 className="font-display font-bold text-6xl sm:text-8xl leading-[0.95] tracking-tight [text-wrap:balance]">
          Your vibe is <span className="italic text-gold">your profile.</span>
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-chalk font-medium">
          Three matches. No games. Real people.
        </p>
        <p className="mt-6 max-w-xl font-display text-2xl sm:text-3xl text-chalk-2 leading-snug font-medium">
          Stop swiping. We pick your people, tell you why, and set up the date.
          You just show up.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-5">
          <Link
            href={applyHref}
            className="bg-gold text-ob text-base sm:text-lg font-medium tracking-[0.12em] uppercase px-10 py-5 text-center hover:brightness-110 transition"
          >
            Get matched
          </Link>
          <span className="text-sm text-chalk-2">
            Free to join the pool. Takes about 5 minutes.
          </span>
        </div>
      </section>

      <section className="px-6 sm:px-12 pb-12 pt-4 max-w-5xl">
        <div className="h-px bg-ob-4 mb-10" />
        <div className="grid sm:grid-cols-3 gap-10">
          {PROMISES.map((p) => (
            <div key={p.title}>
              <div className="font-display font-bold text-2xl text-gold mb-2">{p.title}</div>
              <p className="text-base text-chalk-2 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-12 text-sm text-chalk-3">/date · Matchmaking for humans</p>
      </section>
    </main>
  )
}
