import type { Visibility } from './handles'

// The demo crew. Not real people — seeded in the database so the /hey flow,
// the wall, and the badges can be shown end to end.
export type DemoPerson = {
  handle: string
  name: string
  age: number
  hood: string
  visibility: Visibility
  vibe: string
  spot: string
}

export const DEMO_CREW: DemoPerson[] = [
  {
    handle: 'maya', name: 'Maya', age: 31, hood: 'Wagener Terrace', visibility: 'public',
    vibe: 'Runs the bridge at 6am, argues about pizza like it matters, reads on the porch till the mosquitoes win.',
    spot: 'Golden Hour Coffee',
  },
  {
    handle: 'theo', name: 'Theo', age: 34, hood: 'Cannonborough', visibility: 'public',
    vibe: 'Chef who cooks on his night off. Wants someone who’ll talk for three hours and forget the check.',
    spot: 'Golden Hour Coffee',
  },
  {
    handle: 'priya', name: 'Priya', age: 29, hood: 'Mount Pleasant', visibility: 'tonight',
    vibe: 'ER nurse, three days on, four days off. Kayaks, laughs loud, hates small talk.',
    spot: 'Golden Hour Coffee',
  },
  {
    handle: 'jules', name: 'Jules', age: 36, hood: 'Park Circle', visibility: 'public',
    vibe: 'Moved here last spring for the water. Woodworker, dog dad, good at listening.',
    spot: 'Golden Hour Coffee',
  },
  {
    handle: 'marcus', name: 'Marcus', age: 33, hood: 'West Ashley', visibility: 'private',
    vibe: 'Teacher, coaches JV in the fall. Private on purpose — matchmaker intros only.',
    spot: 'Golden Hour Coffee',
  },
  {
    handle: 'sloane', name: 'Sloane', age: 28, hood: 'Harleston Village', visibility: 'public',
    vibe: 'Architect. Would rather see your bookshelf than your car. Dances badly, on purpose.',
    spot: 'Golden Hour Coffee',
  },
  {
    handle: 'dez', name: 'Dez', age: 30, hood: 'James Island', visibility: 'tonight',
    vibe: 'Surfs Folly at dawn, bartends at night. Tonight-only handle: give it out, it’s gone at midnight.',
    spot: 'Golden Hour Coffee',
  },
]

export function getDemo(handle: string) {
  return DEMO_CREW.find((d) => d.handle === handle)
}
