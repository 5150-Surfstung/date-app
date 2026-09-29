// Val's ear. Turns what someone said into an answer — and is honest about how
// sure it is. It never saves anything: the interview shows what it heard and
// the person confirms. Val's brain (server) can override it when available.

export type Heard = {
  index: number | null        // chosen option, or null
  confidence: 'high' | 'low' | 'none'
  suggestion: number | null   // best guess even when not confident
}

const NUM: Record<string, number> = {
  first: 0, one: 0, '1': 0, '1st': 0, a: 0,
  second: 1, two: 1, '2': 1, '2nd': 1, b: 1,
  third: 2, three: 2, '3': 2, '3rd': 2, c: 2,
  fourth: 3, four: 3, '4': 3, '4th': 3, d: 3,
}

// Plain-English cues per option, keyed by question. Phrases weigh 2, words 1.
const CUES: Record<string, string[][]> = {
  conflict_impulse: [
    ['need space', 'some space', 'process', 'time to think', 'cool off', 'cool down', 'calm down', 'step away', 'walk away', 'breather', 'alone', 'think first', 'space'],
    ['right away', 'immediately', 'talk it out', 'hash it out', 'head on', 'address it', 'deal with it', 'same day', 'get it over', 'confront', 'right then', 'fix it now', 'talk about it'],
    ['feel safe', 'safe enough', 'pull back', 'guard', 'protect myself', 'trust', 'careful', 'guarded', 'honest'],
    ['go quiet', 'get quiet', 'shut down', 'silent', 'silence', 'wait', 'come to me', 'let them come', 'they come', 'avoid', 'ignore'],
  ],
  pull_away: [
    ['give them room', 'give them space', 'room', 'trust', 'let them', 'back off', 'patient', 'they come back', 'give space'],
    ['ask', 'directly', 'what is going on', 'whats going on', 'check in', 'reach out', 'call them', 'text them', 'talk to them', 'straight up'],
    ['reassurance', 'reassure', 'anxious', 'anxiety', 'feel it', 'hurts', 'worry', 'worried', 'insecure', 'overthink', 'need to know', 'panic'],
    ['worst', 'prepare', 'preparing', 'brace', 'assume', 'expect it', 'detach', 'walls up', 'pull away too', 'protect', 'move on', 'its over'],
  ],
  saturday: [
    ['early', 'gym', 'run', 'running', 'workout', 'beach', 'surf', 'sun', 'outside', 'hike', 'boat', 'paddle', 'active', 'morning', 'people', 'movement', 'sunrise'],
    ['slow morning', 'coffee', 'brunch', 'one plan', 'one good plan', 'home by', 'chill', 'cozy', 'relax', 'dinner', 'low key', 'lowkey', 'early night', 'slow'],
    ['no plan', 'no plans', 'spontaneous', 'wing it', 'go with the flow', 'see what happens', 'whatever happens', 'random', 'nothing planned', 'free'],
    ['work on', 'working', 'project', 'build', 'building', 'business', 'create', 'creating', 'side hustle', 'write', 'writing', 'studio', 'grind', 'passion'],
  ],
  life_stage: [
    ['building', 'career', 'business', 'startup', 'company', 'grind', 'busy', 'school', 'hustle', 'work a lot', 'working a lot'],
    ['settled', 'stable', 'ready to share', 'ready', 'established', 'good place', 'figured out', 'my life together', 'share it'],
    ['rebuilding', 'divorce', 'divorced', 'breakup', 'broke up', 'starting over', 'fresh start', 'recovering', 'healing', 'after something', 'big change', 'lost'],
    ['new here', 'new to', 'just moved', 'moved here', 'relocated', 'transplant', 'from scratch', 'new city', 'dont know anyone', 'do not know anyone', 'new in town'],
  ],
  looking_for: [
    ['life partner', 'partner for life', 'marriage', 'married', 'marry', 'wife', 'husband', 'forever', 'the one', 'settle down', 'family', 'kids', 'done auditioning', 'spouse'],
    ['serious', 'relationship', 'long term', 'longterm', 'see where it goes', 'where it goes', 'open to', 'something real', 'commitment', 'exclusive'],
    ['not sure', 'not certain', 'dont know', 'do not know', 'unsure', 'figuring it out', 'done with casual', 'no more casual', 'no hookups', 'not casual'],
  ],
}

const FILLER = /\b(um+|uh+|erm|hmm+|like,|you know,?|i mean,?|so,|well,)\s*/gi

export function norm(s: string) {
  return (' ' + s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ') + ' ')
}

function stem(w: string) { return w.length > 5 ? w.slice(0, 5) : w }
const STOP = new Set(['the', 'and', 'but', 'with', 'what', 'that', 'this', 'your', 'their', 'them', 'they', 'then', 'before', 'until', 'enough', 'about', 'from', 'have', 'just', 'really', 'want', 'need', 'feel', 'like', 'into', 'when', 'where', 'there', 'going', 'good'])

/** Ordinal answers: "the second one", "B", "number three", "the last one". */
export function ordinal(t: string, n: number): number | null {
  const s = norm(t)
  const words = s.trim().split(' ')
  if (/\b(last one|the last)\b/.test(s)) return n - 1
  const m = s.match(/\b(?:number|option|choice)\s+(one|two|three|four|a|b|c|d|1|2|3|4)\b/)
  if (m && NUM[m[1]] !== undefined && NUM[m[1]] < n) return NUM[m[1]]
  const m2 = s.match(/\bthe\s+(first|second|third|fourth|1st|2nd|3rd|4th)\b/) || s.match(/\b(first|second|third|fourth|1st|2nd|3rd|4th)\s+one\b/)
  if (m2 && NUM[m2[1]] < n) return NUM[m2[1]]
  // A bare short answer: "two", "b", "the third".
  if (words.length <= 2) {
    const w = words[words.length - 1]
    if (NUM[w] !== undefined && NUM[w] < n) return NUM[w]
  }
  return null
}

export function matchChoice(qid: string, transcript: string, options: string[]): Heard {
  const t = transcript.trim()
  if (!t) return { index: null, confidence: 'none', suggestion: null }
  const o = ordinal(t, options.length)
  if (o !== null) return { index: o, confidence: 'high', suggestion: o }

  const s = norm(t)
  const cues = CUES[qid] ?? []
  const scores = options.map((opt, i) => {
    let score = 0
    for (const c of cues[i] ?? []) {
      const phrase = ' ' + norm(c).trim() + ' '
      if (!s.includes(phrase)) continue
      // "not casual", "dont want space": a negated cue counts against.
      const at = s.indexOf(phrase)
      const before = s.slice(Math.max(0, at - 12), at)
      const negated = /\b(not|dont|never|no)\s*$/.test(before) && !/^( not| no)/.test(phrase)
      score += (c.includes(' ') ? 2 : 1) * (negated ? -1 : 1)
    }
    // Words from the option itself, stemmed.
    const optWords = new Set(norm(opt).trim().split(' ').filter((w) => w.length > 3 && !STOP.has(w)).map(stem))
    for (const w of Array.from(new Set(s.trim().split(' ').filter((w) => w.length > 3 && !STOP.has(w)).map(stem)))) if (optWords.has(w)) score += 0.75
    return score
  })
  const ranked = scores.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0])
  const [top, i] = ranked[0]
  const second = ranked[1]?.[0] ?? 0
  if (top <= 0) return { index: null, confidence: 'none', suggestion: null }
  const clear = top >= 1.5 && (second <= 0 || top >= second * 1.8)
  return clear ? { index: i, confidence: 'high', suggestion: i } : { index: null, confidence: 'low', suggestion: i }
}

/** Clean spoken text for a written answer, without changing what they said. */
export function tidy(t: string) {
  let s = t.replace(FILLER, '').replace(/\s+/g, ' ').trim()
  for (let i = 0; i < 3; i++) s = s.replace(/^(so|well|okay|ok|and|yeah|like)[,\s]+/i, '')
  if (!s) return ''
  s = s.charAt(0).toUpperCase() + s.slice(1)
  s = s.replace(/\bi\b/g, 'I').replace(/\bim\b/gi, 'I’m').replace(/\bdont\b/gi, 'don’t').replace(/\bcant\b/gi, 'can’t')
  if (!/[.!?]$/.test(s)) s += '.'
  return s
}
