'use client'

// Right after the /vibe: Val gives something back. Her read, in three lines,
// before anyone's been approved or matched. This is the screenshot.
import Link from 'next/link'
import { useRead } from '@/lib/read'
import { useHome } from '@/lib/home'
import { ShareButton } from '../share'

export function ValReadCard() {
  const { state, writing } = useRead()
  const { home } = useHome()
  const text = state?.read?.text
  return (
    <div className="mt-8 rounded-[2rem] bg-ob text-white p-6 sm:p-8 rise">
      <div className="text-xs tracking-[0.2em] uppercase font-extrabold text-white/80">Val&rsquo;s read on you</div>
      {text && !writing ? (
        <>
          <p className="mt-3 font-display font-extrabold text-2xl sm:text-3xl leading-[1.1] [text-wrap:balance]">{text.replace(/\s*—\s*Val\.?\s*$/, '')}</p>
          <div className="mt-3 font-display font-extrabold text-xl">&mdash; Val</div>
          <div className="mt-5 flex flex-wrap gap-3">
            <ShareButton vibe="looking" handle={home?.handle?.handle ?? null} kind="read" read={text} label="Share the card" className="rounded-full bg-white text-ob px-5 py-2.5 text-sm font-extrabold" />
            <Link href="/me/read/" className="rounded-full border-2 border-white px-5 py-2.5 text-sm font-extrabold">Keep it</Link>
          </div>
        </>
      ) : (
        <p className="mt-3 font-display font-extrabold text-2xl leading-snug">Reading you. Twice, like always.</p>
      )}
    </div>
  )
}
