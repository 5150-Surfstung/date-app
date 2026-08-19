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

export default function LandingContent() {
  const params = useSearchParams()
  const slug = params.get('v') ?? undefined
  const venue = slug ? VENUES[slug] : undefined
  const applyHref = slug ? `/apply?v=${encodeURIComponent(slug)}` : '/apply'

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 pt-8">
        <span className="font-display italic text-gold text-xl tracking-wide">/date</span>
        <span className="text-[0.6rem] tracking-[0.22em] uppercase text-chalk-3">
          Season I · 2026
        </span>
      </header>

      <section className="flex-1 flex flex-col justify-center px-6 sm:px-10 max-w-2xl">
        {venue && (
          <div className="border border-gold bg-gold-faint px-5 py-4 mb-10 max-w-md">
            <div className="text-[0.55rem] tracking-[0.2em] uppercase text-gold mb-1.5">
              You scanned in · Venue partner
            </div>
            <div className="font-display text-lg text-chalk">{venue.name}</div>
            <div className="text-[0.62rem] text-chalk-2 leading-relaxed mt-1">
              {venue.area} · {venue.perk}
            </div>
          </div>
        )}

        <h1 className="font-display italic font-light text-5xl sm:text-6xl leading-[1.15] [text-wrap:balance]">
          Your vibe is your profile.
        </h1>
        <p className="mt-5 text-sm text-chalk-3 leading-relaxed">
          Three matches. No games. Real people.
        </p>
        <p className="mt-8 max-w-md font-display text-lg text-chalk-2 leading-relaxed">
          We match the way the best human matchmakers do — slowly, deliberately, and
          on who you actually are. You hear a person before you see them. Every
          profile is verified. Every match comes with a reason.
        </p>

        <div className="mt-10 flex items-center gap-6">
          <Link
            href={applyHref}
            className="border border-gold text-gold text-[0.7rem] tracking-[0.18em] uppercase px-8 py-4 hover:bg-gold-faint transition-colors"
          >
            Apply to join
          </Link>
          <span className="text-[0.62rem] text-chalk-3 tracking-wide">
            Free to be in the pool.
          </span>
        </div>
      </section>

      <section className="px-6 sm:px-10 pb-10 pt-16 max-w-2xl">
        <div className="h-px bg-ob-3 mb-8" />
        <div className="grid sm:grid-cols-3 gap-8">
          <div>
            <div className="text-[0.58rem] tracking-[0.2em] uppercase text-gold mb-2">
              Verified only
            </div>
            <p className="text-[0.7rem] text-chalk-3 leading-relaxed">
              Voice and photo verified, every profile. No bots, no tourists, no games.
            </p>
          </div>
          <div>
            <div className="text-[0.58rem] tracking-[0.2em] uppercase text-gold mb-2">
              Three matches
            </div>
            <p className="text-[0.7rem] text-chalk-3 leading-relaxed">
              Per season, chosen for you. The story before the photos. A reason with
              every pairing.
            </p>
          </div>
          <div>
            <div className="text-[0.58rem] tracking-[0.2em] uppercase text-gold mb-2">
              No ghosts
            </div>
            <p className="text-[0.7rem] text-chalk-3 leading-relaxed">
              Windows close gracefully. Intent is required. No-shows lose their place.
            </p>
          </div>
        </div>
        <p className="mt-10 text-[0.58rem] text-chalk-3/60 tracking-wide">
          /date · Matchmaking for humans
        </p>
      </section>
    </main>
  )
}
