// One small mission per /chat. Kills the first ten awkward minutes.
// Deterministic per chat so both people see the same one.
export const DARES = [
  'Order for each other. No questions allowed.',
  'Each of you brings one photo from your camera roll you’ve never shown anyone. Explain it.',
  'Ask the bartender for their most honest recommendation and take it.',
  'First ten minutes: no phones on the table. Loser buys dessert.',
  'Tell one story you’ve never told on a first date.',
  'Trade one strong opinion about Charleston. Defend it.',
  'Pick the other person’s drink. Then live with it.',
  'Split one thing you’ve both never tried.',
  'Ask what they wanted to be at nine years old. Then say what you wanted.',
  'Find one thing you disagree about before the check comes.',
  'Guess each other’s /tag before you look. Then look.',
  'Walk somewhere after. Anywhere. Ten minutes minimum.',
  'Tell them the thing people misread about you. Val already knows.',
  'Rate the playlist out loud. Together.',
  'Whoever laughs first at their own joke pays.',
  'Ask them what their sixty seconds would be if they recorded it tonight.',
]

export function dareFor(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return DARES[h % DARES.length]
}
