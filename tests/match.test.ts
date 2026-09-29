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
process.exit(fail || !same ? 1 : 0)
