'use client'

// Settings: what Val emails you about, who you've blocked, your data, and
// the door. Safety mail (check-ins, "get me out") can't be switched off.
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AppShell, NeedLogin } from '../../ui'
import { authClient, signOut } from '@/lib/auth'
import { useHome } from '@/lib/home'

type Prefs = { heys: boolean; chats: boolean; dates: boolean; val: boolean }
const PREFS: { k: keyof Prefs; label: string; line: string }[] = [
  { k: 'heys', label: '/heys and /wings', line: 'When someone sends you a /hey, or a friend passes you a /name.' },
  { k: 'chats', label: 'New /chats', line: 'When Val introduces you, or you both say yes.' },
  { k: 'dates', label: 'The morning after', line: '“Worth a /second?” after a date.' },
  { k: 'val', label: 'Val’s notes', line: 'At most one a week, only when something’s actually happening, like your pool being out tonight. Lock screen only.' },
]

export default function Settings() {
  const { email, loading, home, reload } = useHome()
  const [prefs, setPrefs] = useState<Prefs>({ heys: true, chats: true, dates: true, val: true })
  const [blocks, setBlocks] = useState<{ handle: string; at: string }[] | null>(null)
  const [confirm, setConfirm] = useState('')
  const [bye, setBye] = useState<'idle' | 'busy' | 'done' | string>('idle')

  useEffect(() => { if (home?.handle?.email_prefs) setPrefs({ val: true, ...home.handle.email_prefs }) }, [home?.handle?.email_prefs])
  useEffect(() => { if (email) authClient()!.rpc('my_blocks').then(({ data }) => setBlocks(data ?? [])) }, [email])

  if (loading) return <AppShell title="Settings"><p>One sec…</p></AppShell>
  if (!email) return <AppShell title="Settings"><NeedLogin /></AppShell>
  if (bye === 'done') return (
    <AppShell title="Settings">
      <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em]">Gone.</h1>
      <p className="mt-4 text-lg text-[#141414]/65 max-w-md">Your /name, your /vibe, your photos, your voice, your chats. All of it. Thanks for trusting me with it. &mdash; Val</p>
      <Link href="/" className="inline-block mt-6 bg-ob text-white rounded-full px-7 py-3.5 font-extrabold">Back to /date</Link>
    </AppShell>
  )

  async function toggle(k: keyof Prefs) {
    const next = { ...prefs, [k]: !prefs[k] }
    setPrefs(next)
    await authClient()!.rpc('set_email_prefs', { p_prefs: next })
    reload()
  }
  async function unblock(h: string) {
    await authClient()!.rpc('unblock', { p_handle: h })
    setBlocks((b) => (b ?? []).filter((x) => x.handle !== h))
  }
  async function download() {
    const { data } = await authClient()!.rpc('my_data')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `date-${home?.handle?.handle ?? 'me'}.json`; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }
  async function destroy() {
    setBye('busy')
    try {
      const c = authClient()!
      const uid = (await c.auth.getUser()).data.user?.id
      if (uid) {
        const { data: files } = await c.storage.from('date-intake').list(uid, { limit: 100 })
        if (files?.length) await c.storage.from('date-intake').remove(files.map((f) => `${uid}/${f.name}`))
      }
      const { data, error } = await c.rpc('delete_me', { p_confirm: confirm })
      if (error || data !== 'ok') throw new Error('Couldn’t delete. Try again, or ask a person.')
      await signOut().catch(() => {})
      try { localStorage.clear() } catch {}
      setBye('done')
    } catch (e) { setBye(e instanceof Error ? e.message : 'Something went wrong.') }
  }

  return (
    <AppShell title="Settings">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-[-0.03em]">Settings.</h1>
        <Link href="/me/" className="tap text-sm font-extrabold text-[#141414]/50">Done</Link>
      </div>
      <p className="mt-2 text-[#141414]/60">Signed in as {email}.</p>

      <Section title="What Val tells you about">
        <ul className="grid gap-2 max-w-xl">
          {PREFS.map((p) => (
            <li key={p.k}>
              <button onClick={() => toggle(p.k)} disabled={!home?.handle} className="w-full flex items-center gap-4 rounded-2xl border-2 border-[#141414]/10 hover:border-[#141414]/30 px-4 py-3.5 text-left disabled:opacity-50">
                <span className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${prefs[p.k] ? 'bg-ob' : 'bg-[#141414]/15'}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${prefs[p.k] ? 'left-6' : 'left-1'}`} />
                </span>
                <span className="min-w-0"><span className="block font-extrabold">{p.label}</span><span className="block text-sm text-[#141414]/55">{p.line}</span></span>
              </button>
            </li>
          ))}
          <li className="flex items-center gap-4 rounded-2xl bg-[#141414]/[0.04] px-4 py-3.5">
            <span className="w-11 h-6 rounded-full relative shrink-0 bg-[#141414]"><span className="absolute top-1 left-6 w-4 h-4 rounded-full bg-white" /></span>
            <span><span className="block font-extrabold">Safety</span><span className="block text-sm text-[#141414]/55">Your check-ins and &ldquo;get me out.&rdquo; Always on.</span></span>
          </li>
        </ul>
        <p className="mt-3 text-sm text-[#141414]/55">Lock-screen notes are per phone. Turn them on or off from the card at the bottom of any screen, or in your phone&rsquo;s settings.</p>
      </Section>

      <Section title="Blocked">
        {blocks === null ? <p className="text-sm text-[#141414]/50">Loading…</p> : blocks.length === 0 ? (
          <p className="text-sm text-[#141414]/55">Nobody. If someone&rsquo;s off, report them from their page or your /chat. They&rsquo;re blocked the moment you do.</p>
        ) : (
          <ul className="grid gap-2 max-w-xl">
            {blocks.map((b) => (
              <li key={b.handle} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#141414]/10 px-4 py-3">
                <span className="font-display font-extrabold text-lg">/{b.handle}</span>
                <button onClick={() => unblock(b.handle)} className="text-sm font-extrabold text-[#141414]/55 hover:text-ob px-2 py-2">Unblock</button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Talk to a person">
        <p className="text-[#141414]/65 max-w-xl">Something wrong, something unsafe, or you just want a human. A real person reads every one, usually within the hour.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href={`mailto:hello@surfstung.com?subject=${encodeURIComponent(`/date help — /${home?.handle?.handle ?? email}`)}`} className="bg-[#141414] text-white rounded-full px-6 py-3 font-extrabold">Email us</a>
          <Link href="/val" className="border-2 border-[#141414] rounded-full px-6 py-3 font-extrabold">/hey Val</Link>
        </div>
        <p className="mt-3 text-sm text-[#141414]/55">In danger right now? Call 911 first.</p>
      </Section>

      <Section title="Your data">
        <p className="text-[#141414]/65 max-w-xl">Everything /date holds about you, in one file: your /name, your /vibe, every /hey, chat and check-in.</p>
        <button onClick={download} className="mt-3 border-2 border-[#141414] rounded-full px-6 py-3 font-extrabold">Download my data</button>
      </Section>

      <Section title="Leave /date">
        <p className="text-[#141414]/65 max-w-xl">Deletes your /name, /vibe, photos, voice note, chats and history, right now, for good. Open chats close. Reports other people filed stay with Val for safety, detached from you.</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2 max-w-md">
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type DELETE" autoCapitalize="characters"
            className="flex-1 min-w-0 border-2 border-[#141414]/15 focus:border-ob outline-none rounded-full px-5 py-3" />
          <button onClick={destroy} disabled={confirm.trim().toUpperCase() !== 'DELETE' || bye === 'busy'}
            className="bg-ob text-white rounded-full px-6 py-3 font-extrabold disabled:opacity-30">{bye === 'busy' ? 'Deleting…' : 'Delete everything'}</button>
        </div>
        {bye !== 'idle' && bye !== 'busy' && <p className="mt-2 text-sm font-semibold text-ob">{bye}</p>}
      </Section>

      <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#141414]/50">
        <button onClick={() => signOut().then(() => location.assign('/'))} className="font-extrabold text-[#141414] py-2">Sign out</button>
        <Link href="/privacy/" className="underline">Privacy</Link>
        <Link href="/terms/" className="underline">Terms</Link>
        <Link href="/status/" className="underline">Status</Link>
      </div>
    </AppShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 pt-8 border-t border-[#141414]/10">
      <h2 className="text-xs tracking-[0.18em] uppercase font-extrabold text-[#141414]/45 mb-3">{title}</h2>
      {children}
    </section>
  )
}
