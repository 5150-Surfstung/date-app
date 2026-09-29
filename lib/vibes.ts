import type { Tag } from './handles'

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
    sub: 'Claim a /name that goes dark at midnight. Give it out freely. Whatever happens, happens tonight.',
    cta: 'Claim a /tonight name',
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
    sub: 'Three matches a season, one at a time. You hear a person before you see them. Nothing expires but the games.',
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
]

export function vibeFor(tag: Tag) {
  return VIBES.find((v) => v.tag === tag) ?? VIBES[0]
}

// Time-aware pick: after dark leans /tonight, weekend mornings lean /fun.
export function pickVibe(exclude?: Tag): VibeTheme {
  const now = new Date()
  const hour = now.getHours()
  const weekend = now.getDay() === 0 || now.getDay() === 6
  const weights: Record<Tag, number> = {
    looking: 3, tonight: 1, fun: 2, casual: 2, intown: 2, slow: 1, open: 2, curious: 2,
  }
  if (hour >= 18 || hour < 2) weights.tonight += 5
  if (weekend && hour >= 9 && hour < 14) weights.fun += 3
  if (exclude) weights[exclude] = 0
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (const v of VIBES) {
    r -= weights[v.tag]
    if (r <= 0) return v
  }
  return VIBES[0]
}
