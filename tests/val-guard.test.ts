// Val's guardrails. Run: npx tsx tests/val-guard.test.ts
import { polish, violations } from '../supabase/functions/val/prompts'

let fail = 0
const t = (name: string, ok: boolean, got?: unknown) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  → ${JSON.stringify(got)}`}`) }

const good = polish('Maya and Theo, you both go quiet when it matters and say so after. Golden Hour, Thursday; the table is held. Forty-eight hours to pick a time.')
t('good line passes clean', violations(good, 'intro', ['Maya', 'Theo']).length === 0, violations(good, 'intro', ['Maya', 'Theo']))
t('signed exactly once', good.endsWith('— Val') && good.split('— Val').length === 2, good)

const hype = polish('**Amazing** match!!! 🎉 You two are perfect! — Val — Val')
t('hype cleaned: no !, emoji, bold, amazing, double sign-off', !/[!🎉*]|amazing/i.test(hype) && hype.split('— Val').length === 2, hype)

t('percentages caught', violations(polish('You two are a 92% match.'), 'intro').includes('clinical'))
t('"compatibility score" caught', violations(polish('Your compatibility score is high.'), 'intro').includes('clinical'))
t('assumed gender caught', violations(polish('He cooks on his night off, which tells you most of it.'), 'preview').includes('gendered'))
t('"they" is fine', !violations(polish('They cook on a night off, which tells you most of it.'), 'preview').includes('gendered'))
t('missing a name caught', violations(polish('You two should meet.'), 'intro', ['Maya', 'Theo']).includes('missing:Maya'))
t('too long caught', violations(polish(Array(120).fill('word').join(' ')), 'preview').some((v) => v.startsWith('long')))
t('empty caught', violations(polish(''), 'intro').includes('empty'))

console.log(`\n${fail ? 'FAILED' : 'All guardrails hold.'}`)
process.exit(fail ? 1 : 0)
