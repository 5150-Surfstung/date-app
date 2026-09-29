'use client'

// Val's read on you. Three lines, from your own answers, and she rewrites it
// as your dates teach her. Yours to share or keep.
import Link from 'next/link'
import { AppShell, NeedLogin } from '../../ui'
import { useSession } from '@/lib/auth'
import { useHome } from '@/lib/home'
import { useRead } from '@/lib/read'
import { ShareButton } from '../../share'

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export default function ReadPage() {
  const { email, loading } = useSession()
  const { home } = useHome()
  const { state, writing } = useRead()
  if (loading || state === undefined) return <AppShell title="Val’s read"><p className="text-sm">One sec…</p></AppShell>
  if (!email || !state) return <AppShell title="Val’s read"><NeedLogin /></AppShell>
  const handle = home?.handle?.handle ?? null
  const body = state.read?.text.replace(/\s*—\s*Val\.?\s*$/, '')

  return (
    <AppShell title="Val’s read" alerts={false}>
      {!state.has_vibe ? (
        <div className="max-w-md">
          <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em] leading-[0.95]">I need your /vibe first.</h1>
          <p className="mt-4 text-lg text-[#141414]/65">Eight questions and sixty seconds of your voice. Then I tell you who you are. Takes five minutes. &mdash; Val</p>
          <Link href="/apply/" className="inline-block mt-6 bg-ob text-white rounded-full px-8 py-4 font-extrabold">Do my /vibe</Link>
        </div>
      ) : writing || !state.read ? (
        <div className="max-w-md">
          <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em] leading-[0.95]">Reading you.</h1>
          <p className="mt-4 text-lg text-[#141414]/65">Twice, like always. Give me a moment. &mdash; Val</p>
        </div>
      ) : (
        <>
          <div className="rounded-[2rem] bg-ob text-white p-7 sm:p-10 max-w-2xl relative overflow-hidden rise">
            <div className="absolute -right-8 -top-20 font-display font-extrabold text-[16rem] leading-none text-white/[0.07] select-none" aria-hidden>/</div>
            <div className="relative">
              <div className="text-xs tracking-[0.2em] uppercase font-extrabold text-white/80">Val&rsquo;s read on you</div>
              <p className="mt-4 font-display font-extrabold text-2xl sm:text-4xl leading-[1.1] tracking-[-0.02em] [text-wrap:balance]">{body}</p>
              <div className="mt-5 font-display font-extrabold text-2xl">&mdash; Val</div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ShareButton vibe="looking" handle={handle} kind="read" read={state.read.text} label="Share the card" className="rounded-full bg-white text-ob px-5 py-2.5 text-sm font-extrabold" />
                <span className="text-sm text-white/70">{state.read.n > 0 ? `Updated after ${state.read.n} ${state.read.n === 1 ? 'date' : 'dates'}` : 'From your /vibe'} &middot; {when(state.read.at)}</span>
              </div>
            </div>
          </div>
          <p className="mt-5 text-sm text-[#141414]/60 max-w-xl">Built only from your own answers. It changes as your dates teach me. Nobody else ever sees it unless you share it.</p>
          {state.previous && (
            <section className="mt-10 max-w-2xl">
              <div className="text-xs tracking-[0.2em] uppercase font-extrabold text-[#141414]/45">Before that &middot; {when(state.previous.at)}</div>
              <p className="mt-2 text-lg text-[#141414]/60 leading-snug">{state.previous.text.replace(/\s*—\s*Val\.?\s*$/, '')}</p>
            </section>
          )}
        </>
      )}
    </AppShell>
  )
}
