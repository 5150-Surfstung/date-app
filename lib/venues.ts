export type Venue = {
  slug: string
  name: string
  area: string
  perk: string
  // Next /night at this spot, if one is scheduled.
  night?: { when: string; detail: string }
}

// Participating /spots. Edit here until the matchmaker console manages them.
export const VENUES: Venue[] = [
  {
    slug: 'golden-hour',
    name: 'Golden Hour Coffee',
    area: 'Downtown Charleston',
    perk: 'Introduced couples get the corner table and the first round on the house.',
    night: {
      when: 'Thursday, Oct 16 · 7pm',
      detail: 'A room full of verified singles. First hour comped. Scan in at the door.',
    },
  },
]

export function getVenue(slug: string): Venue | undefined {
  return VENUES.find((v) => v.slug === slug)
}
