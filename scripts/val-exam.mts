// Val's exam. Real scenarios through the exact prompts and guardrails the live
// function uses (supabase/functions/val/prompts.ts + VAL.md). Every answer
// must pass her own rules; the vague voice answer must NOT be guessed.
//
//   ANTHROPIC_API_KEY=... npx tsx scripts/val-exam.mts
//
// Run it when her key goes in, and before any change to VAL.md or prompts.ts.
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'node:fs'
import { RULES, prompts, polish, violations, type P } from '../supabase/functions/val/prompts'

const key = process.env.ANTHROPIC_API_KEY
if (!key) { console.log('SKIP  no ANTHROPIC_API_KEY — Val\'s exam runs when her key is set.'); process.exit(0) }
const client = new Anthropic({ apiKey: key })
const SYSTEM = `${readFileSync(new URL('../VAL.md', import.meta.url), 'utf8')}\n\n${RULES}`

async function ask(prompt: string, max: number) {
  const r = await client.messages.create({
    model: 'claude-opus-5-5', max_tokens: max,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  })
  return r.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('').trim()
}

const person = (handle: string, name: string, identity: string, seeking: string, tags: string[], extra: Record<string, string> = {}, age = 29): P => ({
  handle, name, age, hood: 'Downtown', identity, seeking, tags, answers: {
    conflict_impulse: 'I need space to process before I can talk',
    saturday: 'Slow morning, one good plan, home by ten',
    looking_for: 'A serious relationship, open to where it goes',
    commitment: 'Showing up when it is inconvenient.', ...extra,
  },
})
const maya = person('maya', 'Maya', 'Woman', 'Men', ['looking', 'slow'], { misread: 'People think I am cold. I am just paying attention.' })
const theo = person('theo', 'Theo', 'Man', 'Women', ['open', 'fun'], { misread: 'People think I am loud. I am just happy to be there.' }, 31)
const jess = person('jess', 'Jess', 'Woman', 'Women', ['looking'])
const rae = person('rae', 'Rae', 'Woman', 'Women', ['slow', 'looking'], { non_negotiables: 'Honesty, kindness, no smoking.' }, 27)
const sam = person('sam', 'Sam', 'Nonbinary', 'Everyone', ['curious', 'open'])
const kit = person('kit', 'Kit', 'Nonbinary', 'Everyone', ['open'])

type Case = { name: string; job: string; prompt: string; max: number; names?: string[]; check?: (out: string) => string | null }
const cases: Case[] = [
  { name: 'intro · woman + man', job: 'intro', prompt: prompts.intro(maya, theo, ['Both go quiet when it matters.', 'Same Saturday.'], [], 'Golden Hour'), max: 600, names: ['Maya', 'Theo'] },
  { name: 'intro · two women', job: 'intro', prompt: prompts.intro(jess, rae, ['Both lead with /looking.', 'Both want something serious.'], [], 'Golden Hour'), max: 600, names: ['Jess', 'Rae'] },
  { name: 'intro · nonbinary pair', job: 'intro', prompt: prompts.intro(sam, kit, ['Both /open.'], [], 'Golden Hour'), max: 600, names: ['Sam', 'Kit'] },
  { name: 'read · console', job: 'read', prompt: prompts.read(rae), max: 300 },
  { name: 'preview · /wing', job: 'preview', prompt: prompts.preview(theo, 'jules', 'Trust me on this one.'), max: 200 },
  { name: 'brief · five sections', job: 'brief', prompt: prompts.brief(maya, theo, 'Golden Hour, Downtown. Perk: corner table.', 'Thursday 7pm', 'You both said yes.'), max: 900,
    check: (o) => ['WHERE TO GO', 'WHAT TO TALK ABOUT', 'WHAT MATTERS TO THEM', 'WHAT NOT TO DO', 'WHY THIS PAIRING'].every((h) => o.includes(h)) ? null : 'missing a section' },
]
const Q = ['I need space to process before I can talk', 'I want to address it immediately — tension feels worse than the conversation', 'I pull back until I feel safe enough to be honest', 'I go quiet and wait to see if they come to me']
const parses: [string, string, number | null][] = [
  ['parse · clear answer', 'honestly I just need to cool off for a bit first', 0],
  ['parse · vague answer must not guess', 'it really depends on the person', null],
]

let fail = 0
for (const c of cases) {
  const out = polish(await ask(c.prompt, c.max))
  const v = violations(out, c.job, c.names ?? [])
  const extra = c.check?.(out)
  const ok = !v.length && !extra
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}${ok ? '' : `  [${[...v, extra].filter(Boolean).join(', ')}]`}\n      ${out.replace(/\n/g, ' ').slice(0, 220)}`)
}
for (const [name, said, want] of parses) {
  const raw = await ask(prompts.parse('When you are in conflict with someone you love, what is your first impulse?', Q, said), 60)
  let got: number | null = null, conf = 0
  try { const j = JSON.parse(raw.match(/\{[^}]*\}/)?.[0] ?? '{}'); got = typeof j.index === 'number' ? j.index : null; conf = Number(j.confidence) || 0 } catch {}
  const acted = conf >= 0.7 ? got : null            // the app only acts on confident answers
  const ok = acted === want
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  → ${got} (confidence ${conf})`)
}
console.log(`\n${fail ? `${fail} failed. Fix VAL.md or prompts.ts before shipping.` : 'Val passed every case.'}`)
process.exit(fail ? 1 : 0)
