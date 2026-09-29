// Val's one-liners, built from facts already on screen. No AI, no cost, no names.
// A different line each visit, same facts.

type Spot = { name: string; total: number; vibes: { vibe: string; n: number }[] }
type Town = { vibe: string; n: number }

const pick = <T,>(xs: T[], seed: number) => xs[Math.abs(seed) % xs.length]

/** Val's read of the night, from the live map. Null when there's nothing true to say. */
export function tonightLine(spots: Spot[], town: Town[], seed = Date.now()): string | null {
  const s = Math.floor(seed / 60000) // same line for a minute, then a new one
  const top = spots[0]
  const vibe = top?.vibes[0]
  if (top && vibe) return pick([
    `${top.name} is the /${vibe.vibe} spot tonight. ${top.total} in and counting.`,
    `If you're /${vibe.vibe}, you already know: ${top.name}. ${top.total} there now.`,
    `${top.name}: ${top.total} people, mostly /${vibe.vibe}. I'd go.`,
  ], s)
  if (top) return pick([
    `${top.name} is where it's happening. ${top.total} in.`,
    `Busiest room in town right now: ${top.name}.`,
  ], s)
  if (town[0]) return pick([
    `Charleston is /${town[0].vibe} tonight. Nobody's picked a room yet. Be first.`,
    `Everyone's /${town[0].vibe} and nobody's out. Somebody has to go first.`,
  ], s)
  return null
}
