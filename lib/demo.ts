import type { Tag, Visibility } from './handles'

// The demo crew. Not real people — seeded in the database so the /hey flow,
// the wall, and the badges can be shown end to end. Photos are generated;
// they live in public/demo/<handle>.png.
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
    handle: 'ava', name: 'Ava', age: 23, hood: 'Downtown', tag: 'curious', visibility: 'public',
    vibe: 'Graduated in May, works in marketing, still figuring out which bars are hers. First time doing this. Be cool and she’ll be cooler.',
  },
  {
    handle: 'nico', name: 'Nico', age: 24, hood: 'King Street', tag: 'fun', visibility: 'public',
    vibe: 'Rooftop bartender, plays in a band that’s better than it should be. Will make your friends like him first, then you.',
  },
  {
    handle: 'cam', name: 'Cam', age: 25, hood: 'Folly Beach', tag: 'casual', visibility: 'public',
    vibe: 'Surf instructor with freckles and zero patience for phones at dinner. Good company, no pressure, up at dawn.',
  },
  {
    handle: 'sloane', name: 'Sloane', age: 26, hood: 'Harleston Village', tag: 'fun', visibility: 'public',
    vibe: 'Architect. Would rather see your bookshelf than your car. Dances badly, on purpose, and will make you do it too.',
  },
  {
    handle: 'priya', name: 'Priya', age: 29, hood: 'Mount Pleasant', tag: 'tonight', visibility: 'tonight',
    vibe: 'ER nurse, three on, four off. Kayaks, laughs loud, allergic to small talk. Here tonight, gone at midnight. Say something worth it.',
  },
  {
    handle: 'dez', name: 'Dez', age: 30, hood: 'James Island', tag: 'tonight', visibility: 'tonight',
    vibe: 'Surfs Folly at dawn, bartends downtown at night. Knows every good spot in this city and will prove it. Tonight only.',
  },
  {
    handle: 'maya', name: 'Maya', age: 31, hood: 'Wagener Terrace', tag: 'looking', visibility: 'public',
    vibe: 'Runs the Ravenel before sunrise, has strong opinions about pizza crust, and will out-read you on the porch. Looking for the real thing and not pretending otherwise.',
  },
  {
    handle: 'marcus', name: 'Marcus', age: 33, hood: 'West Ashley', tag: 'slow', visibility: 'private',
    vibe: 'Teaches history, coaches JV in the fall. Private on purpose. If Val sends you his way, it’s because it’s worth it.',
  },
  {
    handle: 'theo', name: 'Theo', age: 34, hood: 'Cannonborough', tag: 'open', visibility: 'public',
    vibe: 'Chef. Cooks on his night off, which tells you everything. Wants the three-hour dinner where nobody checks their phone.',
  },
  {
    handle: 'jules', name: 'Jules', age: 36, hood: 'Park Circle', tag: 'intown', visibility: 'public',
    vibe: 'Moved here in April for the water, stayed for the people. Builds furniture, walks a dog named Biscuit, listens better than you’d expect.',
  },
  {
    handle: 'lena', name: 'Lena', age: 38, hood: 'Daniel Island', tag: 'looking', visibility: 'public',
    vibe: 'Pediatrician. Divorced, unbothered, done auditioning. Wants a partner who shows up the same way twice and can hold a conversation over rosé.',
  },
  {
    handle: 'reid', name: 'Reid', age: 40, hood: 'Mount Pleasant', tag: 'slow', visibility: 'public',
    vibe: 'Sails on Sundays, designs houses the rest of the week. In no rush and not pretending to be. Gets it right or doesn’t bother.',
  },
  {
    handle: 'tasha', name: 'Tasha', age: 32, hood: 'North Charleston', tag: 'looking', visibility: 'public',
    vibe: 'Owns the yoga studio on Spruill. Up at five, asleep by ten, laughs from the stomach. Wants someone who can keep up and knows when to slow down.',
  },
  {
    handle: 'mateo', name: 'Mateo', age: 27, hood: 'Daniel Island', tag: 'intown', visibility: 'public',
    vibe: 'Engineer, moved from Seattle in June and hasn’t stopped smiling about the weather. Knows three bars. Wants to know the rest, with you.',
  },
  {
    handle: 'kenji', name: 'Kenji', age: 35, hood: 'Downtown', tag: 'open', visibility: 'public',
    vibe: 'Sommelier on King Street. Will pick the bottle, won’t make it a lecture. Quiet until he isn’t. Open to whatever this turns into.',
  },
  {
    handle: 'bri', name: 'Bri', age: 26, hood: 'Sullivan’s Island', tag: 'fun', visibility: 'public',
    vibe: 'Owns the boutique by the pier and closes early when the water’s good. Beach at seven, dinner at nine, opinions on both. Keep up.',
  },
  {
    handle: 'noor', name: 'Noor', age: 29, hood: 'Downtown', tag: 'looking', visibility: 'public',
    vibe: 'Surgical resident at MUSC. Eighty-hour weeks and still the most fun person at the table. Wants someone worth the one night off.',
  },
  {
    handle: 'sienna', name: 'Sienna', age: 25, hood: 'Harleston Village', tag: 'looking', visibility: 'public',
    vibe: 'Styles shoots for a living, dresses in black on her days off. Quiet until she isn’t. Wants someone who notices things.',
  },
]

export function getDemo(handle: string) {
  return DEMO_CREW.find((d) => d.handle === handle)
}

// Three were generated as PNG, the rest as JPEG.
const PNG = new Set(['maya', 'theo', 'priya'])

export function demoPhoto(handle: string) {
  return `/demo/${handle}.${PNG.has(handle) ? 'png' : 'jpg'}`
}
