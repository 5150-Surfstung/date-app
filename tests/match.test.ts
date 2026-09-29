// Everyone is equal: same rules, same scores, whatever the genders.
// Run: npx tsx tests/match.test.ts
import { scorePair, type Person } from '../lib/match'

const IDS = ['Woman', 'Man', 'Nonbinary'] as const
const SEEK = ['Women', 'Men', 'Everyone'] as const
const wants = (seek: string, id: string) => seek === 'Everyone' || (seek === 'Women' && id === 'Woman') || (seek === 'Men' && id === 'Man')

// Two people identical in every way except identity/seeking.
const base = (h: string, identity: string, seeking: string): Person => ({
  handle: h, name: h, tag: 'looking', tags: ['looking', 'slow'], email: `${h}@x`, visibility: 'public', age: 30, hood: 'Downtown',
  identity, seeking, answers: { conflict_impulse: 'I need space to process before I can talk', saturday: 'Slow morning, one good plan, home by ten', looking_for: 'A serious relationship, open to where it goes' }, app_status: 'approved',
})

let fail = 0
const scores = new Set<number>()
for (const ia of IDS) for (const sa of SEEK) for (const ib of IDS) for (const sb of SEEK) {
  const a = base('a', ia, sa), b = base('b', ib, sb)
  const ab = scorePair(a, b, [], [], [], [])
  const ba = scorePair(b, a, [], [], [], [])
  const should = wants(sa, ib) && wants(sb, ia)
  const ok = Boolean(ab) === should && Boolean(ba) === should && (!ab || !ba || ab.score === ba.score)
  if (ab) scores.add(ab.score)
  if (!ok) { fail++; console.log(`FAIL  ${ia} seeking ${sa}  ×  ${ib} seeking ${sb}  → ${ab?.score ?? 'no pair'} / ${ba?.score ?? 'no pair'} (should pair: ${should})`) }
}
// Every valid pairing — straight, gay, lesbian, nonbinary — scores exactly the same.
const same = scores.size === 1
console.log(`${fail === 0 ? 'PASS' : 'FAIL'}  mutual preference, both directions, all 81 combinations`)
console.log(`${same ? 'PASS' : 'FAIL'}  every valid pairing scores the same (${Array.from(scores).join(', ')})`)

// Val's learned weights: 1s change nothing, a cut signal drops out (reasons too),
// a boosted one counts for more, and the scale never breaks.
const x = base('x', 'Woman', 'Men'), y = { ...base('y', 'Man', 'Women'), hood: 'Downtown', answers: { ...base('y', 'Man', 'Women').answers!, saturday: 'Out late, somewhere new' } }
const plain = scorePair(x, y, [], [])!
const ones = scorePair(x, y, [], [], [], { conflict_impulse: 1, saturday: 1, looking_for: 1, vibes: 1, age: 1, geo: 1 })!
const cutGeo = scorePair(x, y, [], [], [], { geo: 0 })!
const boostSat = scorePair(x, y, [], [], [], { saturday: 2 })!
const allCut = scorePair(x, y, [], [], [], { conflict_impulse: 0, pull_away: 0, saturday: 0, life_stage: 0, looking_for: 0, vibes: 0, age: 0, geo: 0 })!
const learn = [
  ['multipliers of 1 change nothing', ones.score === plain.score],
  ['a cut signal drops its reason', plain.reasons.some((r) => /peninsula/.test(r)) && !cutGeo.reasons.some((r) => /peninsula/.test(r))],
  ['boosting a signal they differ on lowers the score', boostSat.score < plain.score],
  ['scores stay on the 0–100 scale', [plain, ones, cutGeo, boostSat, allCut].every((p) => p.score >= 0 && p.score <= 100)],
  ['every pair reports its signal values', typeof plain.features.saturday === 'number' && typeof plain.features.vibes === 'number'],
] as const
for (const [name, ok] of learn) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) fail++ }
process.exit(fail || !same ? 1 : 0)
