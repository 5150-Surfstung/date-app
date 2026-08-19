const VENUES: Record<string, { name: string; area: string; perk: string }> = {
  'golden-hour': {
    name: 'Golden Hour Coffee',
    area: 'East Nashville',
    perk: 'First dates here get the corner table and a round on the house.',
  },
}

export default function VenueBanner({ slug }: { slug?: string }) {
  if (!slug) return null
  const venue = VENUES[slug]
  if (!venue) return null

  return (
    <div className="border border-gold bg-gold-faint px-5 py-4 mb-10 max-w-md">
      <div className="text-[0.55rem] tracking-[0.2em] uppercase text-gold mb-1.5">
        You scanned in · Venue partner
      </div>
      <div className="font-display text-lg text-chalk">{venue.name}</div>
      <div className="text-[0.62rem] text-chalk-2 leading-relaxed mt-1">
        {venue.area} · {venue.perk}
      </div>
    </div>
  )
}
