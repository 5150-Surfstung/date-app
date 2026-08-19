export type Question = {
  id: string
  dimension: 'conflict' | 'attachment' | 'values' | 'life_stage' | 'energy' | 'intent' | 'self'
  prompt: string
  kind: 'choice' | 'text'
  options?: string[]
  placeholder?: string
}

export const QUESTIONS: Question[] = [
  {
    id: 'conflict_impulse',
    dimension: 'conflict',
    prompt: "When you're in conflict with someone you love, what's your first impulse?",
    kind: 'choice',
    options: [
      'I need space to process before I can talk',
      'I want to address it immediately — tension feels worse than the conversation',
      'I pull back until I feel safe enough to be honest',
      'I go quiet and wait to see if they come to me',
    ],
  },
  {
    id: 'pull_away',
    dimension: 'attachment',
    prompt: 'When someone you care about pulls away, you…',
    kind: 'choice',
    options: [
      'Give them room and trust they’ll come back',
      'Ask directly what’s going on',
      'Feel it immediately and need reassurance',
      'Start quietly preparing for the worst',
    ],
  },
  {
    id: 'saturday',
    dimension: 'energy',
    prompt: 'Your ideal Saturday, honestly.',
    kind: 'choice',
    options: [
      'Out early — movement, sun, people',
      'Slow morning, one good plan, home by ten',
      'No plan at all and I love it that way',
      'Working on something I care about, by choice',
    ],
  },
  {
    id: 'life_stage',
    dimension: 'life_stage',
    prompt: 'Where are you, honestly?',
    kind: 'choice',
    options: [
      'Building something — career or otherwise — and it takes real space',
      'Settled in my life and ready to share it',
      'Rebuilding after something big',
      'New to this city, building from scratch',
    ],
  },
  {
    id: 'looking_for',
    dimension: 'intent',
    prompt: 'What are you actually looking for?',
    kind: 'choice',
    options: [
      'A life partner. I’m done auditioning.',
      'A serious relationship, open to where it goes',
      'Not certain — but certain I’m done with casual',
    ],
  },
  {
    id: 'commitment',
    dimension: 'values',
    prompt: 'What does commitment look like when it’s working?',
    kind: 'text',
    placeholder: 'A sentence or two. In your own words — this is signal, not a quiz.',
  },
  {
    id: 'misread',
    dimension: 'self',
    prompt: 'What do people most often misread about you?',
    kind: 'text',
    placeholder: 'The first impression versus the truth.',
  },
  {
    id: 'non_negotiables',
    dimension: 'values',
    prompt: 'Your non-negotiables. Name up to three.',
    kind: 'text',
    placeholder: 'The real ones — not height.',
  },
]
