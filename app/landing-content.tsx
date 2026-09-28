'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { VENUES, getVenue } from '@/lib/venues'

const PROMISES = [
  {
    title: 'Your /vibe is your profile',
    body: 'Eight real questions, your photos, and sixty seconds of your voice. Verified, every one. No bots, no games.',
  },
  {
    title: '/spots',
    body: 'Scan in at a participating spot. Someone in the room might be on /date too. If it’s mutual, we introduce you. Nobody has to walk over.',
  },
  {
    title: 'Your /name',
    body: 'Give it out instead of your number. Anyone with it can send you a /hey. You see their /vibe first; they see nothing until you say yes.',
  },
  {
    title: '/nights',
    body: 'One night a month at every /spot. A room full of verified singles, first hour comped, introductions made live.',
  },
]

export default function LandingContent() {
  const params = useSearchParams()
  const slug = params.get('v') ?? undefined
  const venue = slug ? getVenue(slug) : undefined
  const applyHref = slug ? `/apply?v=${encodeURIComponent(slug)}` : '/apply'

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-12 pt-8">
        <span className="font-display font-extrabold text-3xl tracking-tight">/date</span>
        <span className="text-xs sm:text-sm tracking-[0.2em] uppercase text-chalk-2 font-medium">
          Charleston · Season I
        </span>
      </header>

      <section className="flex-1 flex flex-col justify-center px-6 sm:px-12 py-16 max-w-4xl">
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

        <h1 className="font-display font-extrabold text-6xl sm:text-8xl leading-[0.95] tracking-[-0.035em] [text-wrap:balance]">
          Your /vibe is your profile.
        </h1>
        <p className="mt-8 text-lg sm:text-xl font-medium">
          Three matches. No games. Real people.
        </p>
        <p className="mt-6 max-w-xl text-xl sm:text-2xl text-chalk-2 leading-snug font-medium">
          Stop swiping. We pick your people, tell you why, and hold the table.
          You just show up. And out in the world, give out your /name instead of
          your number.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-5">
          <Link
            href={applyHref}
            className="bg-white text-ob text-lg font-extrabold rounded-full px-12 py-5 text-center hover:scale-[1.02] transition-transform"
          >
            Get your /vibe
          </Link>
          <Link
            href="/claim"
            className="border-2 border-white text-lg font-extrabold rounded-full px-10 py-5 text-center hover:bg-gold-faint transition-colors"
          >
            Claim your /name
          </Link>
        </div>
      </section>

      <section className="px-6 sm:px-12 pb-12 pt-4 max-w-5xl">
        <div className="h-px bg-ob-4 mb-10" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {PROMISES.map((p) => (
            <div key={p.title}>
              <div className="font-display font-extrabold text-2xl mb-2 tracking-tight">{p.title}</div>
              <p className="text-base text-chalk-2 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <div className="text-xs tracking-[0.2em] uppercase font-medium mb-4">
            Participating /spots
          </div>
          <div className="flex flex-wrap gap-3">
            {VENUES.map((v) => (
              <Link
                key={v.slug}
                href={`/spot/${v.slug}`}
                className="border-2 border-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-gold-faint transition-colors"
              >
                {v.name} · {v.area}
              </Link>
            ))}
            <span className="border-2 border-dashed border-ob-4 rounded-full px-5 py-2.5 text-sm text-chalk-3">
              Your place? hello@surfstung.com
            </span>
          </div>
        </div>

        <p className="mt-12 text-sm text-chalk-3">/date · Matchmaking for humans</p>
      </section>
    </main>
  )
}
