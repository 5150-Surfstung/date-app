'use client'

import { useEffect, useState } from 'react'
import { ShareButton } from '../share'
import Link from 'next/link'
import { AppShell, NeedLogin, Pill } from '../ui'
import { TagLine } from '../tags'
import { authClient, useSession } from '@/lib/auth'
import { tagLine } from '@/lib/handles'
import { QUESTIONS } from '@/lib/questions'
import { askVal, notify } from '@/lib/val'
import { INTAKE_BUCKET } from '@/lib/supabase'

type Item = {
  kind: 'hey' | 'wing'; winger?: string
  id: string; created_at: string; note: string | null; vibe?: string | null; hey_voice?: string | null; to_handle: string
  from: { handle: string; name: string; tag: string | null; tags?: string[] | null; age: number | null; hood: string | null; answers: Record<string, string> | null; has_vibe: boolean; voice_key: string | null; verified: boolean; photos?: string[] }
}

export default function InboxPage() {
  const { email, loading } = useSession()
  const [items, setItems] = useState<Item[] | null>(null)
  const [opened, setOpened] = useState<string | null>(null)
  const [takes, setTakes] = useState<Record<string, string>>({})
  const [asking, setAsking] = useState<string | null>(null)
  const [voices, setVoices] = useState<Record<string, string>>({})

  async function load() {
    const { data } = await authClient()!.rpc('my_inbox')
    setItems((data as Item[]) ?? [])
  }
  useEffect(() => { if (email) load() }, [email])

  async function answer(it: Item, yes: boolean) {
    if (it.kind === 'wing') {
      await authClient()!.rpc('answer_wing', { p_wing: it.id, p_yes: yes })
      load(); return
    }
    const { data } = await authClient()!.rpc('answer_hey', { p_hey: it.id, p_yes: yes })
    if (yes && data) { notify(authClient(), { kind: 'chat', id: data }); location.assign(`/chat/?c=${data}`) }
    else load()
  }

  async function hear(it: Item) {
    if (!it.from.voice_key || voices[it.id]) return
    const { data } = await authClient()!.storage.from(INTAKE_BUCKET).download(it.from.voice_key)
    if (data) setVoices({ ...voices, [it.id]: URL.createObjectURL(data) })
  }

  const [said, setSaid] = useState<Record<string, string>>({})
  async function hearHey(it: Item) {
    if (!it.hey_voice || said[it.id]) return
    const { data } = await authClient()!.storage.from(INTAKE_BUCKET).download(it.hey_voice)
    if (data) setSaid({ ...said, [it.id]: URL.createObjectURL(data) })
  }

  async function take(it: Item) {
    setAsking(it.id)
    const r = await askVal(authClient()!, { kind: 'preview', from: it.from, winger: it.winger, note: it.note })
    setTakes({ ...takes, [it.id]: typeof r.text === 'string' && r.text ? r.text : '' })
    setAsking(null)
  }

  if (loading) return <AppShell title="Inbox"><p>One sec…</p></AppShell>
  if (!email) return <AppShell title="Inbox"><NeedLogin /></AppShell>

  return (
    <AppShell title="Your /heys">
      <h1 className="font-display font-extrabold text-4xl tracking-tight">
        {items === null ? '…' : items.length === 0 ? 'Quiet for now.' : `${items.length} waiting.`}
      </h1>
      <p className="mt-2 text-base text-[#141414]/70 max-w-lg">
        Each one is a /preview. Yes opens a /chat with a 48-hour clock. No is silent &mdash; they never know. &mdash; Val
      </p>

      <div className="mt-8 grid gap-4 max-w-2xl">
        {items?.map((it) => {
          const f = it.from
          const open = opened === it.id
          return (
            <div key={it.id} className="border-2 border-[#141414]/10 rounded-2xl p-5">
              {it.vibe && (
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="font-display font-extrabold text-3xl tracking-tight text-ob">sent you /{it.vibe}</div>
                  <ShareButton vibe={it.vibe} handle={it.to_handle} kind="got" className="rounded-full border-2 border-[#141414] px-4 py-2 text-xs font-extrabold" />
                </div>
              )}
              {it.kind === 'wing' && (
                <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob mb-2">/wing from /{it.winger} &middot; &ldquo;you two should meet&rdquo;</div>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-display font-extrabold text-2xl tracking-tight">
                  /{f.handle} <TagLine tags={f.tags} tag={f.tag} />
                </div>
                <div className="text-xs text-[#141414]/50">{new Date(it.created_at).toLocaleDateString()}</div>
              </div>
              <div className="mt-1 text-sm font-semibold">{f.name}{f.age ? `, ${f.age}` : ''}{f.hood ? ` · ${f.hood}` : ''}</div>
              {f.tag && <div className="text-sm text-[#141414]/60">{tagLine(f.tag)}</div>}
              {it.note && <p className="mt-3 text-base italic">&ldquo;{it.note}&rdquo;</p>}
              {it.hey_voice && (said[it.id]
                ? <audio src={said[it.id]} controls autoPlay className="mt-3 w-full" />
                : <button onClick={() => hearHey(it)} className="mt-3 flex items-center gap-2 rounded-full bg-ob text-white px-5 py-3 text-sm font-extrabold">
                    <span className="w-2.5 h-2.5 rounded-full bg-white live-dot" /> They sent a voice note. Play it
                  </button>)}
              {takes[it.id] ? (
                <p className="mt-3 text-base bg-[#FFF3EA] rounded-xl px-4 py-3">{takes[it.id]} <span className="text-[#141414]/50">&mdash; Val</span></p>
              ) : takes[it.id] === '' ? null : (
                <button onClick={() => take(it)} disabled={asking === it.id} className="mt-3 text-xs font-extrabold text-ob underline underline-offset-4">
                  {asking === it.id ? 'Val\u2019s thinking\u2026' : 'Val\u2019s take'}
                </button>
              )}

              {open && f.answers && (
                <div className="mt-4 grid gap-3 border-t border-[#141414]/10 pt-4">
                  {QUESTIONS.filter((q) => f.answers?.[q.id]).map((q) => (
                    <div key={q.id}>
                      <div className="text-xs tracking-[0.15em] uppercase text-[#141414]/50">{q.prompt}</div>
                      <div className="text-base mt-0.5">{f.answers![q.id]}</div>
                    </div>
                  ))}
                </div>
              )}
              {open && !f.has_vibe && <p className="mt-3 text-sm text-[#141414]/60">They haven&rsquo;t finished their /vibe yet. Val&rsquo;s note: go on the /tag and the line.</p>}

              <div className="mt-4 flex flex-wrap gap-3">
                {!open && <Pill onClick={() => setOpened(it.id)}>/preview</Pill>}
                <Pill primary onClick={() => answer(it, true)}>{it.kind === 'wing' ? `Send /${f.handle} a /hey` : 'Yes \u2014 open a /chat'}</Pill>
                <Pill onClick={() => answer(it, false)}>{it.kind === 'wing' ? 'Pass' : 'No'}</Pill>
                <SafetyLinks handle={it.from.handle} onDone={() => answer(it, false)} />
              </div>
            </div>
          )
        })}
      </div>

      {items?.length === 0 && (
        <p className="mt-6 text-sm text-[#141414]/60">Give your /name out. <Link href="/badge/" className="underline">Print the badge</Link>.</p>
      )}
    </AppShell>
  )
}

// Quiet, one tap: block, or report (which blocks too). Neither tells them.
function SafetyLinks({ handle, onDone }: { handle: string; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  if (done) return <span className="text-xs text-[#141414]/50 self-center">{done}</span>
  if (!open) return <button onClick={() => setOpen(true)} className="tap text-xs font-bold text-[#141414]/45 underline underline-offset-4 self-center px-1">Block or report</button>
  const block = async () => { await authClient()!.rpc('block_handle', { p_handle: handle }); setDone('Blocked. They can’t reach you.'); onDone() }
  const report = async (reason: string) => { await authClient()!.rpc('report_handle', { p_handle: handle, p_reason: reason, p_details: null, p_reporter_email: null, p_chat: null }); setDone('Reported and blocked. Val’s people see it now.'); onDone() }
  return (
    <div className="w-full flex flex-wrap gap-2 mt-1">
      <button onClick={block} className="text-xs font-extrabold border-2 border-[#141414]/15 rounded-full px-3 py-2">Just block</button>
      {['Harassing or pressuring', 'Not who they say they are', 'Under 18', 'Something else felt off'].map((r) => (
        <button key={r} onClick={() => report(r)} className="text-xs font-extrabold border-2 border-ob text-ob rounded-full px-3 py-2">{r}</button>
      ))}
    </div>
  )
}
