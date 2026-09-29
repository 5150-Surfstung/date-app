'use client'

// Your pool: everyone who'd want you back (the database decides that, both
// ways). Val ranks it closest-first, picks your first three, and keeps an eye
// out for strong new fits after that.
import { useCallback, useEffect, useState } from 'react'
import { authClient } from './auth'
import { scorePair, tagsOf, type Person } from './match'

export type PoolPerson = {
  handle: string; name: string; tags: string[] | null; age: number | null; hood: string | null
  answers: Record<string, string> | null; verified: boolean; voice_key: string | null
  photos: string[]; photo_count: number; joined: string | null; i_sent: boolean; sent_me: boolean
}
export type Pick = { handle: string; reason: string | null; created_at: string }
export type Pool = {
  state: 'login' | 'no_name' | 'no_vibe' | 'pending' | 'closed' | 'open'
  me?: { handle: string; tags: string[] | null; age: number | null; hood: string | null; answers: Record<string, string> | null; photo_share: 'all' | 'main' | 'none' }
  picks?: Pick[]
  people?: PoolPerson[]
}
export type Ranked = PoolPerson & { score: number; why: string | null; clash: boolean }

const asPerson = (p: { handle: string; tags: string[] | null; age: number | null; hood: string | null; answers: Record<string, string> | null }, name = ''): Person => ({
  handle: p.handle, name, email: p.handle, tag: tagsOf({ tags: p.tags })[0] ?? null, tags: p.tags,
  visibility: 'public', age: p.age, hood: p.hood, answers: p.answers,
})

/** Closest first, each with Val's reason in plain words. */
export function rank(pool: Pool): Ranked[] {
  if (!pool.me || !pool.people) return []
  const me = asPerson(pool.me)
  return pool.people
    .map((p) => {
      const pair = scorePair(me, asPerson(p, p.name), [], [])
      return {
        ...p,
        score: pair?.score ?? 0,
        why: pair?.reasons.slice(0, 2).join(' ') || null,
        clash: Boolean(pair?.flags.some((f) => /want different things|Not looking for quite/.test(f))),
      }
    })
    .sort((a, b) => b.score - a.score)
}

// Val's first three: the closest fits, skipping obvious clashes when she can.
const FIRST_FLOOR = 45
// Later, only a genuinely strong newcomer earns a mention.
const NEW_FLOOR = 72

function choosePicks(ranked: Ranked[], picks: Pick[]) {
  const taken = new Set(picks.map((p) => p.handle))
  const open = ranked.filter((r) => !taken.has(r.handle) && !r.i_sent)
  if (!picks.length) {
    const good = open.filter((r) => r.score >= FIRST_FLOOR)
    const clean = good.filter((r) => !r.clash)
    return (clean.length >= 3 ? clean : [...clean, ...good.filter((r) => r.clash)]).slice(0, 3)
  }
  const since = Math.max(...picks.map((p) => new Date(p.created_at).getTime()))
  return open.filter((r) => r.score >= NEW_FLOOR && r.joined && new Date(r.joined).getTime() > since).slice(0, 1)
}

export function usePool() {
  const [pool, setPool] = useState<Pool | null>(null)
  const load = useCallback(async () => {
    const c = authClient()
    if (!c) { setPool({ state: 'login' }); return }
    const { data } = await c.rpc('my_pool')
    const p = (data as Pool) ?? { state: 'login' }
    // Val picks (first three, or a strong newcomer) and remembers them.
    if (p.state === 'open') {
      const add = choosePicks(rank(p), p.picks ?? [])
      if (add.length) {
        await c.rpc('save_my_picks', { p: add.map((a) => ({ handle: a.handle, reason: a.why })) })
        const { data: again } = await c.rpc('my_pool')
        setPool((again as Pool) ?? p)
        return
      }
    }
    setPool(p)
  }, [])
  useEffect(() => { load() }, [load])
  return { pool, reload: load }
}

/** Signed links for the photos this viewer is allowed to see. */
export function usePhotoUrls(keys: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const sig = keys.join('|')
  useEffect(() => {
    if (!keys.length) return
    let live = true
    authClient()!.storage.from('date-intake').createSignedUrls(keys, 3600).then(({ data }) => {
      if (!live || !data) return
      setUrls(Object.fromEntries(data.filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl as string])))
    })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])
  return urls
}
