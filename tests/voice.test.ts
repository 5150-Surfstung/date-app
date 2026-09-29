// Val's ear, against how people actually talk. Run: npx tsx tests/voice.test.ts
import { matchChoice, ordinal, tidy } from '../lib/voice'
import { QUESTIONS } from '../lib/questions'

const Q = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.options ?? []]))
type Case = [qid: string, said: string, want: number | null, conf?: 'high' | 'low' | 'none']
const cases: Case[] = [
  // ordinals
  ['conflict_impulse', 'the second one', 1, 'high'],
  ['conflict_impulse', 'number three', 2, 'high'],
  ['pull_away', 'B', 1, 'high'],
  ['saturday', 'um the last one', 3, 'high'],
  ['looking_for', 'two', 1, 'high'],
  ['life_stage', 'first', 0, 'high'],
  // natural answers
  ['conflict_impulse', 'honestly I need some space to cool off before I can talk about it', 0, 'high'],
  ['conflict_impulse', 'I want to deal with it right away, sitting in it is worse', 1, 'high'],
  ['conflict_impulse', 'I kind of go quiet and wait for them to come to me', 3, 'high'],
  ['conflict_impulse', "I pull back until I feel safe enough to be honest", 2, 'high'],
  ['pull_away', 'I just ask them directly what is going on', 1, 'high'],
  ['pull_away', 'I give them space, I trust they come back', 0, 'high'],
  ['pull_away', 'I feel it right away and I need reassurance', 2, 'high'],
  ['pull_away', 'I start bracing for the worst', 3, 'high'],
  ['saturday', 'up early, gym then the beach with friends', 0, 'high'],
  ['saturday', 'slow morning, coffee, brunch, home by ten', 1, 'high'],
  ['saturday', 'no plans at all, I like to wing it', 2, 'high'],
  ['saturday', 'working on my business honestly, I love it', 3, 'high'],
  ['life_stage', 'I just moved here, I dont know anyone yet', 3, 'high'],
  ['life_stage', 'rebuilding after a divorce', 2, 'high'],
  ['life_stage', 'I am settled and ready to share it with someone', 1, 'high'],
  ['life_stage', 'building my career, it takes a lot of space', 0, 'high'],
  ['looking_for', 'I want to get married and have a family', 0, 'high'],
  ['looking_for', 'something serious, see where it goes', 1, 'high'],
  ['looking_for', 'not sure yet but I am done with casual', 2, 'high'],
  // genuinely between two options: don't pick, but point at the closest
  ['looking_for', 'not casual, something real and long term', null, 'low'],
  // nothing useful: never guess
  ['saturday', 'hmm', null, 'none'],
  ['conflict_impulse', 'it depends on the person really', null],
]

let fail = 0
for (const [qid, said, want, conf] of cases) {
  const h = matchChoice(qid, said, Q[qid])
  const ok = h.index === want && (!conf || h.confidence === conf)
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${qid.padEnd(16)} "${said}" → ${h.index} (${h.confidence}${h.suggestion !== null ? `, closest ${h.suggestion}` : ''})${ok ? '' : `  want ${want}${conf ? ' ' + conf : ''}`}`)
}
// "one" inside words must not count as an ordinal
const o = ordinal('someone I love', 4)
console.log(`${o === null ? 'PASS' : 'FAIL'}  "someone" is not "one"`); if (o !== null) fail++
const t = tidy('um so i dont know, i think showing up every day')
console.log(`${t === 'I don’t know, I think showing up every day.' ? 'PASS' : 'FAIL'}  tidy → ${t}`); if (t !== 'I don’t know, I think showing up every day.') fail++
console.log(`\n${cases.length + 2 - fail}/${cases.length + 2} passed`)
process.exit(fail ? 1 : 0)
