// Val's prompts and her guardrails, in one pure file. The live function and
// the exam (scripts/val-exam.mts) both import this, so what's tested is
// exactly what runs. No Deno or Node APIs in here.

export type P = Record<string, unknown>

export function person(p: P) {
  const a = (p.answers ?? {}) as Record<string, string>
  return [
    `/${p.handle} — ${p.name}${p.age ? `, ${p.age}` : ''}${p.hood ? `, ${p.hood}` : ''}`,
    Array.isArray(p.tags) && (p.tags as string[]).length
      ? `/tags (lead first): ${(p.tags as string[]).map((t) => `/${t}`).join(' ')}`
      : p.tag ? `/tags: /${p.tag}` : '',
    p.identity ? `${p.identity}, seeking ${p.seeking ?? 'everyone'}` : '',
    a.conflict_impulse ? `Conflict: ${a.conflict_impulse}` : '',
    a.pull_away ? `When someone pulls away: ${a.pull_away}` : '',
    a.saturday ? `Saturday: ${a.saturday}` : '',
    a.life_stage ? `Life stage: ${a.life_stage}` : '',
    a.looking_for ? `Looking for: ${a.looking_for}` : '',
    a.commitment ? `Commitment, in their words: ${a.commitment}` : '',
    a.misread ? `People misread: ${a.misread}` : '',
    a.non_negotiables ? `Non-negotiables: ${a.non_negotiables}` : '',
    p.vibe ? `Bio: ${p.vibe}` : '',
  ].filter(Boolean).join('\n')
}

export const RULES = `You are Val. Write only what is asked, in Val's voice, plain text, no markdown, no headings unless the format asks for them. Never invent facts about a person; use only what you're given. Never assume anyone's gender or who they're into: use their name or /name, and "they". No percentages, no scores, no clinical words. No exclamation marks, no emojis, no "amazing". Sign with "— Val" exactly once at the end.`

export const prompts = {
  intro: (a: P, b: P, reasons: string[], flags: string[], spot: string) =>
    `Write Val's intro note that opens a /chat between these two. 2–4 short sentences: name them both, give the real reason in plain words (from the reasons below, not the numbers), ${spot ? "mention the /spot and that the table's held" : "tell them to pick somewhere public they'd both go anyway (name no place)"}, and that they have forty-eight hours to pick a time.\n\nPerson A:\n${person(a)}\n\nPerson B:\n${person(b)}\n\nWhy Val paired them: ${reasons.join(' ') || 'gut call'}\nWatch-outs (don't mention unless useful): ${flags.join(' ') || 'none'}\nSuggested /spot: ${spot || 'none yet'}`,
  read: (p: P) =>
    `Write Val's two-line read of this person for the console: who they actually are and what they need in a match. No flattery, no clinical words.\n\n${person(p)}`,
  preview: (from: P, winger: string | null, note: string | null) =>
    `Write one or two sentences of Val's context for the person reading their inbox: why this /hey (or /wing) is worth a look. Plain, specific, no hype. ${winger ? `A friend, /${winger}, passed this /name along.` : 'They sent a /hey.'}${note ? ` Their note: "${note}".` : ''}\n\nThe sender:\n${person(from)}`,
  brief: (reader: P, other: P, spot: string, when: string, note: string) =>
    `Write the /brief for the reader before their date. Five sections, each a heading on its own line exactly as written, then 1–3 short sentences:\nWHERE TO GO\nWHAT TO TALK ABOUT\nWHAT MATTERS TO THEM\nWHAT NOT TO DO\nWHY THIS PAIRING\n\nReader (writing FOR this person, address them as "you"):\n${person(reader)}\n\nTheir date:\n${person(other)}\n\n/spot: ${spot}\nWhen: ${when}\nVal's note when the chat opened: ${note}`,
  readme: (p: P, debriefs: string[], previous: string | null) =>
    `Write Val's read of this person, to them ("you"). Three short sentences, plain words, from their own answers only. One thing they say about themselves next to one thing their answers actually show; be specific and a little too accurate, never cruel, never flattering. End with what whoever gets them will need to do. No labels, no types, no advice lists.${previous ? ` This is an update: their earlier read is below, and what has happened since. Keep what still holds, change what the dates changed, and say in one short clause what changed.` : ''}\n\n${person(p)}${debriefs.length ? `\n\nWhat happened on their dates since, in their own private words: ${debriefs.join('; ')}` : ''}${previous ? `\n\nEarlier read: ${previous}` : ''}`,
  parse: (question: string, options: string[], said: string) =>
    `You're matching a spoken answer to one multiple-choice option in a dating app interview. Reply with JSON only, no prose, no signature: {"index": <0-based option index or null>, "confidence": <0 to 1>}. Use null if they didn't clearly mean one option. Never pick just to pick.\n\nQuestion: ${question}\nOptions:\n${options.map((o, i) => `${i}. ${o}`).join('\n')}\n\nThey said: "${said.slice(0, 600)}"`,
}

export const LIMITS: Record<string, number> = { intro: 90, read: 70, preview: 60, brief: 220, readme: 85 }

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/gu
const CLINICAL = /\b(compatib\w*|attachment style|algorithm|match score|score|percent|percentage|data shows|statistically|analy[sz]\w*)\b|%/i
const GENDERED = /\b(he|she|him|her|his|hers|himself|herself|boyfriend|girlfriend|husband|wife)\b/i

/** Val's house style, applied to anything she writes before anyone sees it. */
export function polish(raw: string) {
  let s = raw.replace(/\*\*|__|^#+\s*/gm, '').replace(EMOJI, '').replace(/!+/g, '.').replace(/\bamazing\b/gi, 'good')
  s = s.replace(/\s*[—–-]\s*Val\.?\s*$/i, '').replace(/[—–-]\s*Val\b/g, '').trim()
  s = s.replace(/\.\.+/g, '.').replace(/[ \t]+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim()
  return s ? `${s}${/[.?]$/.test(s) ? '' : '.'} — Val` : ''
}

/** What's still wrong after polish. Any hit = rewrite once, then template. */
export function violations(text: string, job: string, names: string[] = []) {
  const v: string[] = []
  if (!text.trim()) v.push('empty')
  if (CLINICAL.test(text)) v.push('clinical')
  if (GENDERED.test(text)) v.push('gendered')
  if ((text.match(/— Val/g) ?? []).length !== 1) v.push('signoff')
  const words = text.split(/\s+/).length
  if (LIMITS[job] && words > LIMITS[job]) v.push(`long:${words}`)
  for (const n of names) if (n && !text.toLowerCase().includes(n.toLowerCase())) v.push(`missing:${n}`)
  return v
}

/** Val's read when her brain is off: built from the answers, so it's still true, just plainer. */
export function templateRead(p: P, outcomes: string[] = []): string {
  const a = (p.answers ?? {}) as Record<string, string>
  const lines: string[] = []
  const conflict = a.conflict_impulse ?? ''
  if (/immediately|address it/i.test(conflict)) lines.push('You go straight at a problem; you would rather have the hard talk than the quiet week.')
  else if (/space|process/i.test(conflict)) lines.push('You need room before you can say the true thing, and you always get to it.')
  else if (/quiet|wait/i.test(conflict)) lines.push('When it matters you go quiet and watch who comes to you. Someone will have to come to you.')
  else if (/pull back|safe/i.test(conflict)) lines.push('You pull back until it feels safe, then you are honest all at once.')
  const sat = a.saturday ?? ''
  if (/slow|home by/i.test(sat)) lines.push('Your Saturdays say you like one good plan and an early night, whatever else you say.')
  else if (/out|late|new/i.test(sat)) lines.push('Your Saturdays say you get restless, and you will need someone who can keep up or let you go.')
  if (a.looking_for) lines.push(`You said "${String(a.looking_for).toLowerCase()}", and your answers back it up.`)
  if (a.misread) lines.push(`People misread you as ${String(a.misread).toLowerCase().replace(/\.$/, '')}. Whoever gets you will have to look twice.`)
  const seconds = outcomes.filter((o) => o === 'second').length, sparks = outcomes.filter((o) => o === 'no_spark').length
  lines.splice(outcomes.length ? 3 : 4)
  if (outcomes.length) lines.push(seconds ? `Since then: you said /second ${seconds === 1 ? 'once' : `${seconds} times`}. That is the number I watch.` : sparks >= 2 ? 'Since then: no spark, twice. I am changing who I send you.' : 'Since then: I am still watching.')
  const out = lines.join(' ') || 'I have read your answers twice. Finish your /vibe and I will tell you who you are.'
  return `${out} — Val`
}
