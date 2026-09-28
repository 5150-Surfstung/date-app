// Val's voice in the app. See VAL.md for the operating manual; every
// string here follows it. First person, short, signed.

export const VAL = {
  name: 'Val',
  handle: 'val',
  sign: '— Val',

  heySent: (name: string) =>
    `Sent. I'll show ${name} your /vibe and ask. If it's a yes, you'll hear from me. If not, nothing happens and nobody knows.`,

  claimed: (handle: string) =>
    `/${handle} is yours. Give it out instead of your number. Anyone with it can send you a /hey — I'll show you their /vibe first, and they hear nothing until you say yes.`,

  privateWall: `This /name is private. Introductions come through me only.`,

  spotIn: `You're in. If someone here catches your eye, tell me. They never hear about it unless it's mutual.`,

  spotNoticed: `Got it. If it's mutual, you'll hear from me. If not, nothing happens and nobody knows. Enjoy your night.`,

  applied: `I read every /vibe myself. When your Season is ready to begin, you'll hear from me — and not before. No noise in between.`,

  valWall: `I'm the matchmaker. Send me a /hey for help, an intro, or to tell me something didn't work. I always answer.`,
}
