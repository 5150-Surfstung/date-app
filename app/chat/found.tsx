'use client'

// "We found each other." Both tap it, both come off the market. Then, only
// if both say so, the story goes on the wall; either can take it down.
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth'
import { ShareButton } from '../share'

type Couple = { id: string; together: boolean; me_yes: boolean; them_yes: boolean; me_share: boolean; them_share: boolean; hidden: boolean; a: string; b: string; spot: string | null; reason: string | null } | null

export function Found({ chatId, them }: { chatId: string; them: string }) {
  const [c, setC] = useState<Couple | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const load = () => authClient()!.rpc('my_couple', { p_chat: chatId }).then(({ data }) => setC((data as Couple) ?? null))
  useEffect(() => { load() }, [chatId])

  async function tap() {
    setBusy(true)
    await authClient()!.rpc('found_each_other', { p_chat: chatId })
    await load(); setBusy(false)
  }
  async function share(yes: boolean) {
    if (!c) return
    setBusy(true)
    await authClient()!.rpc('share_our_story', { p_couple: c.id, p_yes: yes })
    await load(); setBusy(false)
  }
  async function back() {
    if (!confirm('Put yourself back in the pool? Your story comes down too.')) return
    setBusy(true)
    await authClient()!.rpc('back_on_the_market')
    await load(); setBusy(false)
  }

  if (c === undefined) return null
  if (!c || !c.me_yes) return (
    <div className="rounded-2xl border-2 border-[#141414] p-4">
      <div className="font-display font-extrabold text-xl">Found your person?</div>
      <p className="text-sm text-[#141414]/70 mt-1">If /{them} taps it too, you both come off the market. Nothing is shared unless you both say so.</p>
      <button onClick={tap} disabled={busy} className="mt-3 bg-ob text-white rounded-full px-5 py-2.5 text-sm font-extrabold disabled:opacity-50">We found each other</button>
    </div>
  )
  if (!c.together) return (
    <div className="rounded-2xl border-2 border-ob p-4">
      <div className="font-display font-extrabold text-xl">Waiting on /{them}.</div>
      <p className="text-sm text-[#141414]/70 mt-1">They&rsquo;ve been told. If they tap it too, you&rsquo;re both off the market.</p>
    </div>
  )
  const live = c.me_share && c.them_share && !c.hidden
  return (
    <div className="rounded-2xl bg-ob text-white p-4 grid gap-3">
      <div>
        <div className="font-display font-extrabold text-2xl">Off the market. Congrats.</div>
        <p className="text-sm text-white/85 mt-1">You&rsquo;re both out of everyone&rsquo;s pool. Val&rsquo;s very pleased with herself.</p>
      </div>
      {live ? (
        <>
          <p className="text-sm font-semibold">Your story is on the /date wall.</p>
          <div className="flex flex-wrap gap-2">
            <ShareButton vibe="looking" handle={null} kind="couple" couple={{ a: c.a, b: c.b, spot: c.spot }} label="Share our card" className="rounded-full bg-white text-ob px-4 py-2 text-sm font-extrabold" />
            <button onClick={() => share(false)} disabled={busy} className="rounded-full border-2 border-white px-4 py-2 text-sm font-extrabold">Take it down</button>
          </div>
        </>
      ) : c.me_share ? (
        <p className="text-sm">You said yes to sharing your story. It goes up only if /{them} says yes too.</p>
      ) : (
        <div>
          <p className="text-sm">Share your story on the /date wall? Just your /names, where you met and why Val paired you. It goes up only if you both say yes, and either of you can take it down anytime.</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => share(true)} disabled={busy} className="rounded-full bg-white text-ob px-4 py-2 text-sm font-extrabold">Yes, share it</button>
            <button onClick={() => share(false)} disabled={busy} className="rounded-full px-4 py-2 text-sm font-semibold">Keep it private</button>
          </div>
        </div>
      )}
      <button onClick={back} disabled={busy} className="justify-self-start text-xs text-white/70 underline">Back on the market</button>
    </div>
  )
}
