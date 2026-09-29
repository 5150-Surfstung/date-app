import { ogCard, OG_SIZE } from '@/lib/og'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = '/date — Three matches. No games. Real people.'

export default function Image() {
  return ogCard({ big: 'Your /vibe is your profile.', kicker: 'Matchmaking with Val', line: 'Three matches. No games. Real people.', vibe: 'looking' })
}
