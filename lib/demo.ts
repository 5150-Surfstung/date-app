import type { Tag, Visibility } from './handles'

// The demo crew. Not real people — seeded in the database so the /hey flow,
// the wall, and the badges can be shown end to end.
export type DemoPerson = {
  handle: string
  name: string
  age: number
  hood: string
  tag: Tag
  visibility: Visibility
  vibe: string
}

export const DEMO_CREW: DemoPerson[] = [
  {
    handle: 'maya', name: 'Maya', age: 31, hood: 'Wagener Terrace', tag: 'looking', visibility: 'public',
    vibe: 'Runs the Ravenel before sunrise, has strong opinions about pizza crust, and will out-read you on the porch. Looking for the real thing and not pretending otherwise.',
  },
  {
    handle: 'theo', name: 'Theo', age: 34, hood: 'Cannonborough', tag: 'open', visibility: 'public',
    vibe: 'Chef. Cooks on his night off, which tells you everything. Wants the three-hour dinner where nobody checks their phone.',
  },
  {
    handle: 'priya', name: 'Priya', age: 29, hood: 'Mount Pleasant', tag: 'tonight', visibility: 'tonight',
    vibe: 'ER nurse, three on, four off. Kayaks, laughs loud, allergic to small talk. Here tonight, gone at midnight. Say something worth it.',
  },
  {
    handle: 'jules', name: 'Jules', age: 36, hood: 'Park Circle', tag: 'intown', visibility: 'public',
    vibe: 'Moved here in April for the water, stayed for the people. Builds furniture, walks a dog named Biscuit, listens better than you’d expect.',
  },
  {
    handle: 'marcus', name: 'Marcus', age: 33, hood: 'West Ashley', tag: 'slow', visibility: 'private',
    vibe: 'Teaches history, coaches JV in the fall. Private on purpose. If the matchmaker sends you his way, it’s because it’s worth it.',
  },
  {
    handle: 'sloane', name: 'Sloane', age: 28, hood: 'Harleston Village', tag: 'fun', visibility: 'public',
    vibe: 'Architect. Would rather see your bookshelf than your car. Dances badly, on purpose, and will make you do it too.',
  },
  {
    handle: 'dez', name: 'Dez', age: 30, hood: 'James Island', tag: 'tonight', visibility: 'tonight',
    vibe: 'Surfs Folly at dawn, bartends downtown at night. Knows every good spot in this city and will prove it. Tonight only.',
  },
]

export function getDemo(handle: string) {
  return DEMO_CREW.find((d) => d.handle === handle)
}
