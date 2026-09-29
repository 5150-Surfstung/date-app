// Val's matching engine. Deterministic, explainable, and every score comes
// with reasons in Val's voice. The weights below are the starting point; Val
// learns a multiplier for each signal every night from what actually
// happened (date_val_learn), and cuts signals that predict nothing.
import type { Tag } from './handles'

export type Person = {
  handle: string
  name: string
  tag: Tag | null
  /** Up to three, lead first. Falls back to [tag]. */
  tags?: Tag[] | null
  email: string
  visibility: string
  age?: number | null
  hood?: string | null
  identity?: string | null
  seeking?: string | null
  answers?: Record<string, string> | null
  app_status?: string | null
}

export type Signal = { kind: string; venue_slug: string; email: string; note: string | null }
export type Hey = { to_handle: string; from_email: string; status: string }
export type Wing = { subject_handle: string; to_handle: string | null; from_email: string }

export type Pair = {
  a: Person
  b: Person
  score: number
  reasons: string[]
  flags: string[]
  /** Each signal's value for this pair, 0–1. Logged so Val can learn which ones matter. */
  features: Features
}

/** The signals Val weighs. Hard filters (who each wants, age ranges) are not signals and never learn. */
export const SIGNALS = ['conflict_impulse', 'pull_away', 'saturday', 'life_stage', 'looking_for', 'vibes', 'age', 'geo', 'spot'] as const
export type SignalKey = (typeof SIGNALS)[number]
export type Features = Partial<Record<SignalKey, number>>
/** Learned multipliers, 1 = the starting weight, 0 = cut. Missing = 1. */
export type Mults = Partial<Record<SignalKey, number>>

// /tag chemistry, 0–1. Symmetric.
const TAG: Record<string, number> = {
  'looking|looking': 1, 'looking|slow': .9, 'looking|open': .7, 'looking|intown': .7, 'looking|curious': .6,
  'looking|fun': .45, 'looking|casual': .15, 'looking|tonight': .1,
  'casual|casual': 1, 'casual|fun': .9, 'casual|tonight': .8, 'casual|intown': .7, 'casual|open': .6, 'casual|curious': .5, 'casual|slow': .2,
  'fun|fun': 1, 'fun|tonight': .8, 'fun|intown': .8, 'fun|open': .7, 'fun|curious': .7, 'fun|slow': .3,
  'tonight|tonight': 1, 'tonight|intown': .7, 'tonight|open': .5, 'tonight|curious': .4, 'tonight|slow': .1,
  'intown|intown': .8, 'intown|open': .8, 'intown|curious': .7, 'intown|slow': .6,
  'slow|slow': 1, 'slow|open': .8, 'slow|curious': .7,
  'open|open': .8, 'open|curious': .8,
  'curious|curious': .7,
  'chill|chill': 1, 'chill|slow': .9, 'chill|casual': .8, 'chill|open': .8, 'chill|curious': .7, 'chill|intown': .7, 'chill|fun': .6, 'chill|looking': .6, 'chill|tonight': .5, 'chill|frisky': .4,
  'frisky|frisky': 1, 'frisky|tonight': .9, 'frisky|casual': .8, 'frisky|fun': .8, 'frisky|open': .6, 'frisky|intown': .6, 'frisky|curious': .5, 'frisky|looking': .2, 'frisky|slow': .15,
}
function tagFit(a?: Tag | null, b?: Tag | null) {
  if (!a || !b) return .5
  if (a === b) return 1 // the same word, even one they made up
  return TAG[`${a}|${b}`] ?? TAG[`${b}|${a}`] ?? .4
}

export const MAX_TAGS = 3
export function tagsOf(p: { tag?: Tag | null; tags?: Tag[] | null }): Tag[] {
  const t = (p.tags?.length ? p.tags : p.tag ? [p.tag] : []).filter(Boolean) as Tag[]
  return Array.from(new Set(t)).slice(0, MAX_TAGS)
}

// Three words, read the way a person would: the leads carry 60%, the best
// match anywhere across both sets carries 40%. A shared word is a reason; a
// clash between leads is a flag unless something else lines up.
export function tagChemistry(a: Tag[], b: Tag[]) {
  if (!a.length || !b.length) return { fit: .5, reasons: [] as string[], flags: [] as string[] }
  const lead = tagFit(a[0], b[0])
  let best = 0, bestPair: [Tag, Tag] = [a[0], b[0]]
  for (const x of a) for (const y of b) { const f = tagFit(x, y); if (f > best) { best = f; bestPair = [x, y] } }
  const fit = .6 * lead + .4 * best
  const shared = a.filter((t) => b.includes(t))
  const reasons: string[] = []
  const flags: string[] = []
  if (a[0] === b[0]) reasons.push(`Both lead with /${a[0]}.`)
  else if (lead >= .8) reasons.push(`/${a[0]} and /${b[0]} pull the same direction.`)
  const extra = shared.filter((t) => !(t === a[0] && t === b[0]))
  if (extra.length) reasons.push(`Both ${extra.map((t) => `/${t}`).join(' and ')}.`)
  if (lead <= .2) {
    if (best >= .8) flags.push(`Leads differ (/${a[0]}, /${b[0]}), but ${bestPair[0] === bestPair[1] ? `both are /${bestPair[0]}` : `/${bestPair[0]} and /${bestPair[1]} line up`}.`)
    else flags.push(`/${a[0]} and /${b[0]} want different things.`)
  }
  return { fit, reasons, flags }
}

// Charleston clusters. Same cluster = easy first date.
const CLUSTER: Record<string, string> = {
  'downtown': 'peninsula', 'harleston village': 'peninsula', 'cannonborough': 'peninsula', 'wagener terrace': 'peninsula',
  'king street': 'peninsula', 'south of broad': 'peninsula', 'french quarter': 'peninsula', 'eastside': 'peninsula',
  'mount pleasant': 'east', 'daniel island': 'east', "sullivan's island": 'east', 'isle of palms': 'east',
  'james island': 'islands', 'folly beach': 'islands', 'johns island': 'islands',
  'west ashley': 'west', 'park circle': 'north', 'north charleston': 'north', 'summerville': 'north',
}
function cluster(h?: string | null) {
  return CLUSTER[(h ?? '').toLowerCase().trim()] ?? null
}

// Answers that pair well even when different.
const COMPLEMENT: Record<string, string[][]> = {
  conflict_impulse: [
    ['I need space to process before I can talk', 'I pull back until I feel safe enough to be honest'],
    ['I want to address it immediately — tension feels worse than the conversation', 'I need space to process before I can talk'],
  ],
  pull_away: [
    ['Give them room and trust they’ll come back', 'Ask directly what’s going on'],
  ],
}
const BAD: Record<string, string[][]> = {
  conflict_impulse: [
    ['I go quiet and wait to see if they come to me', 'I pull back until I feel safe enough to be honest'],
  ],
  pull_away: [
    ['Feel it immediately and need reassurance', 'Give them room and trust they’ll come back'],
  ],
}
function pairIn(list: string[][], x: string, y: string) {
  return list.some(([p, q]) => (p === x && q === y) || (p === y && q === x))
}

function seekingOk(a: Person, b: Person) {
  const want = (s?: string | null) => (s ?? 'Everyone').toLowerCase()
  const is = (i?: string | null) => (i ?? '').toLowerCase()
  const ok = (p: Person, q: Person) => {
    const w = want(p.seeking)
    if (w === 'everyone' || !is(q.identity)) return true
    if (w === 'women') return is(q.identity) === 'woman'
    if (w === 'men') return is(q.identity) === 'man'
    return true
  }
  return ok(a, b) && ok(b, a)
}

function ageOk(a: Person, b: Person) {
  const ra = a.answers ?? {}, rb = b.answers ?? {}
  const inRange = (age?: number | null, min?: string, max?: string) =>
    !age || ((!min || age >= Number(min)) && (!max || age <= Number(max)))
  return inRange(b.age, ra.age_min, ra.age_max) && inRange(a.age, rb.age_min, rb.age_max)
}

export function scorePair(a: Person, b: Person, signals: Signal[], heys: Hey[], wings: Wing[] = [], mults?: Mults | unknown[]): Pair | null {
  if (a.email === b.email) return null
  if (!seekingOk(a, b)) return null
  if (!ageOk(a, b)) return null
  if (a.visibility === 'private' && b.visibility === 'private') return null

  const reasons: string[] = []
  const flags: string[] = []
  const features: Features = {}
  // Weighted parts of the base score. With every multiplier at 1 they add to 80
  // and the score is exactly the hand-set one; learned multipliers reshape it
  // without changing the scale. A cut signal (0) drops out, reasons and all.
  const parts: { key: SignalKey | null; w: number; f: number }[] = []
  const m = (k: SignalKey) => (mults && !Array.isArray(mults) ? Math.max(0, mults[k] ?? 1) : 1)
  const says = (k: SignalKey, ...r: string[]) => { if (m(k) >= 0.25) reasons.push(...r) }

  // Vibes are the hook, not the answer. What makes two people work is how
  // they fight, what they want and how they spend a Saturday, so the answers
  // carry the most weight and the vibe words are a light nudge.

  // 1. The answers — 50 between them
  const A = a.answers ?? {}, B = b.answers ?? {}
  const keys = (['conflict_impulse', 'pull_away', 'saturday', 'life_stage', 'looking_for'] as const).filter((k) => A[k] && B[k])
  for (const key of keys) {
    const x = A[key], y = B[key]
    let v: number
    if (x === y) { v = 1; if (key === 'looking_for') says(key, 'Want the same thing, in the same words.'); if (key === 'saturday') says(key, 'Same kind of Saturday.'); if (key === 'life_stage') says(key, 'Same place in life.') }
    else if (pairIn(COMPLEMENT[key] ?? [], x, y)) { v = .85; if (key === 'conflict_impulse') says(key, 'Their conflict styles fit — one talks, one thinks first.') }
    else if (pairIn(BAD[key] ?? [], x, y)) { v = .1; flags.push('Both go quiet when it matters. Watch that.') }
    else if (key === 'looking_for') { v = .3; flags.push('Not looking for quite the same thing.') }
    else v = .5
    features[key] = v
    parts.push({ key, w: 50 / keys.length, f: v })
  }
  if (!keys.length) { parts.push({ key: null, w: 50, f: .5 }); flags.push('One of them hasn’t finished a /vibe yet.') }

  // 2. Vibe words — 10. Up to three each, lead first.
  const tc = tagChemistry(tagsOf(a), tagsOf(b))
  parts.push({ key: 'vibes', w: 10, f: tc.fit })
  features.vibes = tc.fit
  says('vibes', ...tc.reasons)
  flags.push(...tc.flags)

  // 3. Age — 15
  if (a.age && b.age) {
    const gap = Math.abs(a.age - b.age)
    const fit = gap <= 3 ? 1 : gap <= 6 ? .8 : gap <= 9 ? .5 : gap <= 12 ? .25 : 0
    parts.push({ key: 'age', w: 15, f: fit })
    features.age = fit
    if (gap <= 3) says('age', `${gap === 0 ? 'Same age' : `${gap} year${gap > 1 ? 's' : ''} apart`}.`)
    if (gap > 9) flags.push(`${gap} years apart.`)
  } else parts.push({ key: 'age', w: 15, f: 8 / 15 })

  // 4. Geography — 5
  const ca = cluster(a.hood), cb = cluster(b.hood)
  if (ca && cb) {
    const fit = ca === cb ? 1 : (ca === 'peninsula' && cb !== 'north') || (cb === 'peninsula' && ca !== 'north') ? .6 : .3
    parts.push({ key: 'geo', w: 5, f: fit })
    features.geo = fit
    if (ca === cb) says('geo', `Both ${ca === 'peninsula' ? 'on the peninsula' : ca === 'east' ? 'east of the Cooper' : ca === 'islands' ? 'on the islands' : 'up north'}.`)
  } else parts.push({ key: 'geo', w: 5, f: .5 })

  const W = parts.reduce((t, p) => t + p.w * (p.key ? m(p.key) : 1), 0)
  let score = W ? 80 * parts.reduce((t, p) => t + p.w * (p.key ? m(p.key) : 1) * p.f, 0) / W : 40

  // 5. Real life — up to 20: same /spots, a /hey or a /wing between them
  if (signals.length) {
    const spotsA = new Set(signals.filter((s) => s.email === a.email && s.kind === 'checkin').map((s) => s.venue_slug))
    const spotsB = new Set(signals.filter((s) => s.email === b.email && s.kind === 'checkin').map((s) => s.venue_slug))
    const shared = Array.from(spotsA).filter((s) => spotsB.has(s))
    features.spot = Math.min(1, shared.length / 2)
    if (shared.length) { score += Math.min(10, 5 * shared.length) * m('spot'); says('spot', `Both check in at the same /spot.`) }
  }
  const hey = heys.find((h) => (h.from_email === a.email && h.to_handle === b.handle) || (h.from_email === b.email && h.to_handle === a.handle))
  if (hey) { score += 10; reasons.push('One of them already sent a /hey.') }
  const wing = wings.find((w) => (w.subject_handle === a.handle && w.to_handle === b.handle) || (w.subject_handle === b.handle && w.to_handle === a.handle))
  if (wing) { score += 10; reasons.push('A friend /winged this pair.') }

  return { a, b, score: Math.round(Math.min(100, score)), reasons, flags, features }
}

export function suggestPairs(people: Person[], signals: Signal[], heys: Hey[], existing: Set<string>, limit = 20, wings: Wing[] = [], mults?: Mults): Pair[] {
  const out: Pair[] = []
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const key = [people[i].handle, people[j].handle].sort().join('|')
      if (existing.has(key)) continue
      const p = scorePair(people[i], people[j], signals, heys, wings, mults)
      if (p) out.push(p)
    }
  }
  return out.sort((x, y) => y.score - x.score).slice(0, limit)
}

// Val's intro when no AI key is configured.
export function draftIntro(p: Pair, spotName?: string | null) {
  const why = p.reasons.slice(0, 3).join(' ')
  const where = spotName ? `I'd try ${spotName} — table's held if you want it.` : `Somewhere public, somewhere you'd both go anyway.`
  return `${p.a.name}, meet ${p.b.name}. ${why} Forty-eight hours to pick a time. ${where} — Val`
}
