'use client'

// /missed: "you were both there". Only people who checked in here, around the
// same time, ever see a post. Anonymous until both say yes; gone after 72 hours.
import { useEffect, useState } from 'react'
import { authClient, useSession } from '@/lib/auth'

type Post = { id: string; you: string; me: string | null; created_at: string; claimed?: boolean; claims?: number }
type Feed = { state: 'login' | 'not_approved' | 'not_here' | 'here'; mine?: Post[]; posts?: Post[] }

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 6e4)
  return m < 60 ? `${Math.max(1, m)}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`
}

export function Missed({ slug, name, refresh }: { slug: string; name: string; refresh?: number }) {
  const { email } = useSession()
  const [feed, setFeed] = useState<Feed | null>(null)
  const [you, setYou] = useState('')
  const [me, setMe] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => authClient()!.rpc('missed_feed', { p_spot: slug }).then(({ data }) => setFeed(data as Feed))
  useEffect(() => { if (email) load() }, [email, slug, refresh])

  async function post() {
    setBusy(true); setMsg(null)
    const { data } = await authClient()!.rpc('post_missed', { p_spot: slug, p_you: you, p_me: me || null })
    setBusy(false)
    if (data === 'ok') { setYou(''); setMe(''); setMsg('Posted. Only people who were here tonight can see it.'); load(); return }
    setMsg(data === 'words' ? 'Clothes, moments and vibes only. No bodies, no contact info.' : data === 'one_a_night' ? 'One a night. Make it count.' : data === 'not_here' ? 'Check in here first.' : 'Couldn’t post. Try again.')
  }
  async function claim(id: string) {
    const { data } = await authClient()!.rpc('claim_missed', { p_id: id })
    setMsg(data === 'ok' ? 'Sent. If they say yes, Val opens a /chat for you both.' : data === 'not_there' ? 'You weren’t here around then.' : null)
    load()
  }
  async function hide(id: string) { await authClient()!.rpc('hide_missed', { p_id: id }); load() }

  if (!email || !feed || feed.state === 'login' || feed.state === 'not_approved') return null
  if (feed.state === 'not_here') return (
    <section className="rounded-3xl border-2 border-dashed border-[#141414]/20 p-5">
      <div className="font-display font-extrabold text-2xl tracking-tight">/missed</div>
      <p className="mt-1 text-[#141414]/70">Saw someone here and didn&rsquo;t say anything? Check in, and you can leave a note only people who were here tonight will see.</p>
    </section>
  )

  return (
    <section className="rounded-3xl bg-[#141414] text-white p-5 sm:p-6 grid gap-4">
      <div>
        <div className="font-display font-extrabold text-3xl tracking-tight">/missed</div>
        <p className="mt-1 text-white/70">You were both at {name}. Only people who checked in here around the same time can see these. No names until you both say yes.</p>
      </div>

      {(feed.posts ?? []).length > 0 && (
        <ul className="grid gap-2">
          {feed.posts!.map((p) => (
            <li key={p.id} className="rounded-2xl bg-white text-[#141414] p-4">
              <p className="text-base"><span className="font-extrabold">You:</span> {p.you}</p>
              {p.me && <p className="text-sm text-[#141414]/70 mt-1"><span className="font-extrabold">Me:</span> {p.me}</p>}
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-[#141414]/50">{ago(p.created_at)}</span>
                {p.claimed
                  ? <span className="text-sm font-extrabold text-ob">You said that was you</span>
                  : <button onClick={() => claim(p.id)} className="bg-ob text-white rounded-full px-4 py-2 text-sm font-extrabold">That was me</button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {(feed.mine ?? []).map((p) => (
        <div key={p.id} className="rounded-2xl border-2 border-white/20 p-4 text-sm">
          <div className="text-white/60 text-xs uppercase tracking-[0.15em] font-semibold">Your note &middot; {ago(p.created_at)}</div>
          <p className="mt-1">{p.you}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-extrabold text-ob">{p.claims ? `${p.claims} ${p.claims === 1 ? 'person says' : 'people say'} that was them. Check your inbox.` : 'No one yet.'}</span>
            <button onClick={() => hide(p.id)} className="underline text-white/60">Take it down</button>
          </div>
        </div>
      ))}

      {(feed.mine ?? []).length === 0 && (
        <div className="grid gap-2">
          <label className="text-sm font-extrabold">Who did you see?</label>
          <input value={you} onChange={(e) => setYou(e.target.value)} maxLength={140} placeholder="Green jacket, laughed at the bartender’s joke"
            className="rounded-2xl px-4 py-3 text-base text-[#141414] outline-none" />
          <input value={me} onChange={(e) => setMe(e.target.value)} maxLength={140} placeholder="And you? (optional) The one who didn’t say hi"
            className="rounded-2xl px-4 py-3 text-base text-[#141414] outline-none" />
          <p className="text-xs text-white/50">Clothes, moments and vibes only. Gone in 72 hours. One a night.</p>
          <button onClick={post} disabled={busy || you.trim().length < 3} className="justify-self-start bg-ob text-white rounded-full px-6 py-3 font-extrabold disabled:opacity-40">Post it</button>
        </div>
      )}
      {msg && <p className="text-sm font-semibold text-ob">{msg}</p>}
    </section>
  )
}
