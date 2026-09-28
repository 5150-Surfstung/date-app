'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell, NeedLogin, Pill } from '../ui'
import { authClient, useSession } from '@/lib/auth'
import { TAGS, type Tag } from '@/lib/handles'
import { QUESTIONS } from '@/lib/questions'

type Handle = { handle: string; name: string; tag: Tag | null; visibility: string; founding_number: number | null; email: string }
type App = { id: string; age: number; neighborhood: string | null; identity: string; seeking: string; answers: Record<string, string>; status: string; verified: boolean; has_voice_note: boolean; photo_count: number }

export default function MePage() {
  const { email, loading } = useSession()
  const [h, setH] = useState<Handle | null | undefined>(undefined)
  const [app, setApp] = useState<App | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const c = authClient()!
    const { data: hs } = await c.from('date_handles').select('*').eq('email', email!).limit(1)
    setH((hs?.[0] as Handle) ?? null)
    const { data: as } = await c.from('date_applications').select('*').eq('email', email!).limit(1)
    setApp((as?.[0] as App) ?? null)
  }
  useEffect(() => { if (email) load() }, [email])

  async function setTag(tag: Tag | null, priv: boolean) {
    if (!h) return
    setSaving(true)
    await authClient()!.rpc('set_tag', { p_handle: h.handle, p_email: h.email, p_tag: tag, p_private: priv })
    await load(); setSaving(false)
  }

  if (loading || h === undefined) return <AppShell title="You"><p>One sec…</p></AppShell>
  if (!email) return <AppShell title="You"><NeedLogin /></AppShell>
  if (h === null) return (
    <AppShell title="You">
      <h1 className="font-display font-extrabold text-4xl tracking-tight">No /name on this email yet.</h1>
      <Link href="/claim/" className="inline-block mt-6 bg-ob text-white rounded-full px-7 py-3.5 font-extrabold">Claim one</Link>
    </AppShell>
  )

  const priv = h.visibility === 'private'
  return (
    <AppShell title="You">
      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em]">/{h.handle} {h.tag && <span className="text-ob">/{h.tag}</span>}</h1>
        {h.founding_number && <span className="text-sm font-extrabold text-ob">Founding member #{String(h.founding_number).padStart(3, '0')}</span>}
        {app?.verified && <span className="text-xs font-extrabold tracking-[0.15em] uppercase bg-[#141414] text-white rounded-full px-3 py-1">Verified by Val</span>}
      </div>
      <p className="mt-2 text-base text-[#141414]/70">{h.name} &middot; {h.email}</p>

      <div className="mt-8 grid gap-2 max-w-xl">
        <div className="text-xs tracking-[0.18em] uppercase text-[#141414]/50">Your /tag &mdash; change it any time</div>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <button key={t.value} disabled={saving} onClick={() => setTag(h.tag === t.value ? null : t.value, priv)} title={t.line}
              className={`px-4 py-2 border-2 rounded-full text-sm font-extrabold transition-colors ${h.tag === t.value ? 'bg-ob text-white border-ob' : 'border-[#141414]/15 hover:border-[#141414]'}`}>/{t.value}</button>
          ))}
        </div>
        <button disabled={saving} onClick={() => setTag(h.tag, !priv)} className={`self-start mt-2 px-4 py-2 border-2 rounded-full text-sm font-extrabold ${priv ? 'bg-[#141414] text-white border-[#141414]' : 'border-[#141414]/15'}`}>
          {priv ? 'Private — on' : 'Private — off'}
        </button>
        <p className="text-xs text-[#141414]/50">Private means your /name shows nothing and only Val introduces you. /tonight goes dark at midnight.</p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={`/badge/?h=${h.handle}`} className="bg-ob text-white rounded-full px-6 py-3 font-extrabold">Print my badge</Link>
        <Link href={`/${h.handle}`} className="border-2 border-[#141414] rounded-full px-6 py-3 font-extrabold">My /hey page</Link>
      </div>

      <div className="mt-12 max-w-xl">
        <div className="text-xs tracking-[0.18em] uppercase text-[#141414]/50 mb-3">Your /vibe</div>
        {app ? (
          <div className="grid gap-3">
            <div className="text-sm text-[#141414]/70">{app.age} &middot; {app.neighborhood ?? '—'} &middot; {app.identity} seeking {app.seeking} &middot; {app.photo_count} photos &middot; {app.has_voice_note ? 'voice note in' : 'no voice note'} &middot; status: {app.status.replace('_', ' ')}</div>
            {QUESTIONS.filter((q) => app.answers?.[q.id]).map((q) => (
              <div key={q.id}><div className="text-xs text-[#141414]/50">{q.prompt}</div><div className="text-base">{app.answers[q.id]}</div></div>
            ))}
            <p className="text-xs text-[#141414]/50 mt-2">To change your answers, redo your /vibe &mdash; Val reads the newest one.</p>
          </div>
        ) : (
          <div>
            <p className="text-base">You have a /name but no /vibe yet. Val can&rsquo;t match you without one.</p>
            <Link href="/apply/" className="inline-block mt-4 bg-ob text-white rounded-full px-6 py-3 font-extrabold">Get your /vibe</Link>
          </div>
        )}
      </div>

      <p className="mt-12 text-xs text-[#141414]/40">Want out? Email hello@surfstung.com and everything is deleted. <Link href="/privacy/" className="underline">Privacy</Link> &middot; <Link href="/terms/" className="underline">Terms</Link></p>
    </AppShell>
  )
}
