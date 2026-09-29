import type { Tag, CoreTag } from './handles'

// The homepage takes on a /vibe every visit. One theme per tag.
export type VibeTheme = {
  tag: Tag
  bg: string
  fg: string
  accent: string   // button fill
  onAccent: string // text on the button
  muted: string
  headline: string
  sub: string
  cta: string
}

export const VIBES: VibeTheme[] = [
  {
    tag: 'looking', bg: '#FF3B2F', fg: '#FFFFFF', accent: '#FFFFFF', onAccent: '#FF3B2F', muted: 'rgba(255,255,255,0.75)',
    headline: 'Your /vibe is your profile.',
    sub: 'Stop swiping. Val picks your people, tells you why, and holds the table. You just show up.',
    cta: 'Get your /vibe',
  },
  {
    tag: 'tonight', bg: '#140A20', fg: '#F6EFFF', accent: '#FF5CA8', onAccent: '#140A20', muted: 'rgba(246,239,255,0.7)',
    headline: 'It’s tonight. Say something worth it.',
    sub: 'Set your vibe to /tonight and see who else is out. Change it back whenever you want.',
    cta: 'Claim your /name',
  },
  {
    tag: 'fun', bg: '#FFD23F', fg: '#141414', accent: '#141414', onAccent: '#FFD23F', muted: 'rgba(20,20,20,0.7)',
    headline: 'Say yes to the plan.',
    sub: 'A room full of verified singles, introductions made live. Once a month, at the best places in town.',
    cta: 'Claim your /name',
  },
  {
    tag: 'casual', bg: '#BFE3FF', fg: '#0A1A2A', accent: '#0A1A2A', onAccent: '#BFE3FF', muted: 'rgba(10,26,42,0.7)',
    headline: 'Good company. No pressure.',
    sub: 'Not everyone’s here for forever, and that’s fine. Your /tag says so before a word is said.',
    cta: 'Pick your /tag',
  },
  {
    tag: 'intown', bg: '#0E7C7B', fg: '#F2FFFE', accent: '#F2FFFE', onAccent: '#0E7C7B', muted: 'rgba(242,255,254,0.75)',
    headline: 'New here? Your people are here.',
    sub: 'No network, no idea which spots are good. Val does. Three introductions and a table held at the best of them.',
    cta: 'Get your /vibe',
  },
  {
    tag: 'slow', bg: '#1F3D2B', fg: '#EEF5EA', accent: '#EEF5EA', onAccent: '#1F3D2B', muted: 'rgba(238,245,234,0.72)',
    headline: 'No rush. Get it right.',
    sub: 'Val sends your three closest matches first, with the reason for each. Then take your time with everyone else.',
    cta: 'Get your /vibe',
  },
  {
    tag: 'open', bg: '#FFF3EA', fg: '#141414', accent: '#FF3B2F', onAccent: '#FFFFFF', muted: 'rgba(20,20,20,0.65)',
    headline: 'Not sure yet. Honest about it.',
    sub: 'You don’t have to know what you want to be worth knowing. Say /open and let Val do the reading.',
    cta: 'Claim your /name',
  },
  {
    tag: 'curious', bg: '#E9DDFF', fg: '#1B1033', accent: '#1B1033', onAccent: '#E9DDFF', muted: 'rgba(27,16,51,0.7)',
    headline: 'First time doing this? Be cool.',
    sub: 'No swiping, no bios to agonize over. Eight questions, sixty seconds of your voice, and a matchmaker named Val.',
    cta: 'Get your /vibe',
  },
  {
    tag: 'chill', bg: '#CFE8E1', fg: '#10302A', accent: '#10302A', onAccent: '#CFE8E1', muted: 'rgba(16,48,42,0.7)',
    headline: 'Low key. Good company.',
    sub: 'No production, no pressure. Somebody who’s easy to sit next to. Val knows a few.',
    cta: 'Claim your /name',
  },
  {
    tag: 'frisky', bg: '#FF5CA8', fg: '#140A20', accent: '#140A20', onAccent: '#FF5CA8', muted: 'rgba(20,10,32,0.72)',
    headline: 'Feeling it tonight?',
    sub: 'Set your vibe, see who else is feeling it, and send a vibe back. Verified people only.',
    cta: 'Claim your /name',
  },
]

export function vibeFor(tag: Tag) {
  const core = VIBES.find((v) => v.tag === tag)
  if (core) return core
  // A vibe someone made up: their word, in the house colors.
  const base = VIBES.find((v) => v.tag === 'open') ?? VIBES[0]
  return { ...base, tag, headline: `Tonight you’re /${tag}.`, sub: 'Change it whenever you want. Val’s already looking for people on the same page.', cta: 'Claim your /name' }
}

// Time-aware pick: after dark leans /tonight, weekend mornings lean /fun.
export function pickVibe(exclude?: Tag): VibeTheme {
  const now = new Date()
  const hour = now.getHours()
  const weekend = now.getDay() === 0 || now.getDay() === 6
  const weights: Record<CoreTag, number> = {
    looking: 3, tonight: 1, fun: 2, casual: 2, intown: 2, slow: 1, open: 2, curious: 2, chill: 2, frisky: 1,
  }
  if (hour >= 18 || hour < 2) { weights.tonight += 4; weights.frisky += 2 }
  if (weekend && hour >= 9 && hour < 14) weights.fun += 3
  if (exclude && exclude in weights) weights[exclude as CoreTag] = 0
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (const v of VIBES) {
    r -= weights[v.tag as CoreTag] ?? 0
    if (r <= 0) return v
  }
  return VIBES[0]
}
