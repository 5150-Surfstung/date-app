'use client'

// People who said "that was me" to your /missed note. Yes opens a /chat; no is silent.
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth'
import { notify } from '@/lib/val'
import { TagLine } from '../tags'

type Claim = { claim: string; post: string; spot: string | null; created_at: string; from: { handle: string; name: string; tags: string[] | null; age: number | null; hood: string | null; verified: boolean } }

export function MissedClaims() {
  const [list, setList] = useState<Claim[]>([])
  const load = () => authClient()!.rpc('my_missed_claims').then(({ data }) => setList((data as Claim[]) ?? []))
  useEffect(() => { load() }, [])
  async function answer(c: Claim, yes: boolean) {
    const { data } = await authClient()!.rpc('answer_missed_claim', { p_claim: c.claim, p_yes: yes })
    if (yes && typeof data === 'string' && data.length > 20) { notify(authClient(), { kind: 'chat', id: data }); location.assign(`/chat/?c=${data}`); return }
    load()
  }
  if (!list.length) return null
  return (
    <section className="mb-8 grid gap-3">
      <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">/missed &middot; they say that was them</div>
      {list.map((c) => (
        <div key={c.claim} className="rounded-2xl bg-[#141414] text-white p-5">
          <p className="text-sm text-white/60">Your note{c.spot ? ` at ${c.spot}` : ''}: &ldquo;{c.post}&rdquo;</p>
          <div className="mt-3 font-display font-extrabold text-2xl tracking-tight">/{c.from.handle} <TagLine tags={c.from.tags} /></div>
          <div className="text-sm text-white/80">{c.from.name}{c.from.age ? `, ${c.from.age}` : ''}{c.from.hood ? ` · ${c.from.hood}` : ''}{c.from.verified ? ' · Verified' : ''}</div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => answer(c, true)} className="bg-ob text-white rounded-full px-5 py-2.5 text-sm font-extrabold">Yes, that&rsquo;s them</button>
            <button onClick={() => answer(c, false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-white/70">Not them</button>
          </div>
        </div>
      ))}
    </section>
  )
}
