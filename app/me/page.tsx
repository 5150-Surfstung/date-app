'use client'

// /me — the member home. Never empty: where you stand with Val, what's
// waiting, your intros this season, and your /vibe at a glance.
import Link from 'next/link'
import { useState } from 'react'
import { AppShell, NeedLogin } from '../ui'
import { authClient } from '@/lib/auth'
import { type Tag } from '@/lib/handles'
import { TagPicker, TagLine } from '../tags'
import { useHome, usePhotos, type Home } from '@/lib/home'

const pad = (n: number) => String(n).padStart(3, '0')

function standing(home: Home): { step: number; head: string; line: string; cta?: { href: string; label: string } } {
  const v = home.vibe
  if (home.handle?.suspended) return { step: 1, head: 'Your /name is paused.', line: 'Someone raised a concern, so I’ve paused you while a person looks at it. That’s how I keep everyone safe, you included. If it’s a mistake, it gets fixed fast. — Val', cta: { href: '/me/settings/', label: 'Talk to a person' } }
  if (home.handle?.benched) return { step: 1, head: 'You’re out of the pool for now.', line: 'Two people waited for you and you didn’t come. Your /name is private and I’ve stopped pairing you. If I’ve got it wrong, talk to a person. — Val', cta: { href: '/me/settings/', label: 'Talk to a person' } }
  if (!v) return { step: 1, head: 'Val can’t match you yet.', line: 'Your /name is live, but matches come from your /vibe: eight questions, three photos, sixty seconds of your voice. About five minutes.', cta: { href: '/apply/', label: 'Finish my /vibe' } }
  if (v.status === 'rejected') return { step: 1, head: 'Not this season.', line: 'Thanks for trusting me with your /vibe. — Val' }
  if (v.status === 'waitlisted') return { step: 2, head: 'You’re on the waitlist.', line: 'Your /vibe is good. I’m balancing the pool before I open more spots. You’ll hear from me first. — Val' }
  if (v.status === 'pending_review' && !v.verified) return { step: 2, head: 'Val is reading your /vibe.', line: 'I read every one myself, twice. Next: I verify your photos and voice, then you’re in the pool. — Val' }
  if (!home.intros.length) return { step: 3, head: 'You’re in. Val is looking.', line: 'No swiping. I’m finding your first person, and I’ll tell you why when I do. Meanwhile, give out your /name. — Val', cta: { href: '/badge/', label: 'Print my badge' } }
  return { step: 4, head: 'Your season is live.', line: 'Every intro comes with a reason and a table. Say yes, pick a time, go. — Val' }
}

export default function MePage() {
  const { email, loading, home, reload } = useHome()
  const [saving, setSaving] = useState(false)
  const photos = usePhotos(home?.vibe?.photo_keys?.slice(0, 3))

  if (loading) return <AppShell title="You"><Skeleton /></AppShell>
  if (!email) return <AppShell title="You"><NeedLogin /></AppShell>
  if (!home?.handle) return (
    <AppShell title="You">
      <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em] leading-[0.95]">First, a /name.</h1>
      <p className="mt-4 text-lg text-[#141414]/65 max-w-md">It&rsquo;s what you give out instead of your number. Thirty seconds.</p>
      <Link href="/claim/" className="inline-block mt-6 bg-ob text-white rounded-full px-8 py-4 font-extrabold">Claim my /name</Link>
    </AppShell>
  )

  const h = home.handle
  const s = standing(home)
  const priv = h.visibility === 'private'
  const myTags = ((h.tags?.length ? h.tags : h.tag ? [h.tag] : []) as Tag[])
  async function saveTags(tags: Tag[], p: boolean) {
    setSaving(true)
    await authClient()!.rpc('set_tags', { p_tags: tags, p_private: p })
    await reload(); setSaving(false)
  }
  const steps = ['/name', '/vibe', 'Verified', 'Intros']

  return (
    <AppShell title="You">
      {/* Identity */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display font-extrabold text-[clamp(3rem,11vw,5.5rem)] leading-[0.9] tracking-[-0.04em] break-all">/{h.handle}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {myTags.length > 0 && <span className="font-display font-extrabold text-2xl"><TagLine tags={myTags} /></span>}
            {h.founding && <span className="text-xs font-extrabold tracking-[0.14em] uppercase border-2 border-[#141414] rounded-full px-3 py-1">Founding #{pad(h.founding)}</span>}
            {home.vibe?.verified && <span className="text-xs font-extrabold tracking-[0.14em] uppercase bg-[#141414] text-white rounded-full px-3 py-1">Verified</span>}
            {priv && <span className="text-xs font-extrabold tracking-[0.14em] uppercase bg-[#141414]/8 rounded-full px-3 py-1">Private</span>}
          </div>
        </div>
        <Link href="/me/settings/" aria-label="Settings" className="shrink-0 w-12 h-12 grid place-items-center rounded-full border-2 border-[#141414]/15 hover:border-[#141414]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
        </Link>
      </div>

      {/* Where you stand */}
      <section className="mt-8 rounded-[28px] bg-[#141414] text-white p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-16 font-display font-extrabold text-[14rem] leading-none text-white/[0.04] select-none" aria-hidden>/</div>
        <ol className="flex gap-1.5">
          {steps.map((label, i) => (
            <li key={label} className="flex-1 min-w-0">
              <div className={`h-1.5 rounded-full ${i < s.step ? 'bg-ob' : 'bg-white/15'}`} />
              <div className={`mt-2 text-[11px] sm:text-xs font-extrabold tracking-[0.12em] uppercase truncate ${i < s.step ? 'text-white' : 'text-white/35'}`}>{label}</div>
            </li>
          ))}
        </ol>
        <h2 className="mt-6 font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.02em] leading-tight">{s.head}</h2>
        <p className="mt-3 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">{s.line}</p>
        {s.cta && <Link href={s.cta.href} className="inline-block mt-6 bg-ob text-white rounded-full px-7 py-3.5 font-extrabold">{s.cta.label}</Link>}
      </section>

      {/* The numbers that matter */}
      <section className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat n={home.waiting} label="Waiting for you" href="/inbox/" hot={home.waiting > 0} />
        <Stat n={home.open_chats} label="Open /chats" href="/chat/" hot={home.open_chats > 0} />
        <Stat n={home.dates} label="Dates set" />
        <Stat n={home.heys_sent} label="/heys sent" />
      </section>

      {/* Intros from Val */}
      {home.intros.length > 0 && (
        <section className="mt-10">
          <Eyebrow>From Val this season</Eyebrow>
          <ul className="grid gap-2">
            {home.intros.map((i) => (
              <li key={i.id}>
                <Link href={`/chat/?c=${i.id}`} className="flex items-center justify-between gap-3 border-2 border-[#141414]/10 hover:border-[#141414] rounded-2xl px-5 py-4">
                  <span className="font-display font-extrabold text-xl truncate">/{i.with}{i.second && <span className="text-ob"> · /second</span>}</span>
                  <span className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#141414]/50 shrink-0">{i.status === 'date_set' ? 'Date set' : i.status === 'open' ? 'Open' : 'Closed'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* /tag */}
      <section className="mt-10">
        <Eyebrow>Your /tags &mdash; up to three, change them any time</Eyebrow>
        <TagPicker value={myTags} onChange={(t) => saveTags(t, priv)} disabled={saving} />
        <button disabled={saving} onClick={() => saveTags(myTags, !priv)}
          className={`mt-4 flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left ${priv ? 'border-[#141414] bg-[#141414] text-white' : 'border-[#141414]/15'}`}>
          <span className={`w-10 h-6 rounded-full relative shrink-0 ${priv ? 'bg-ob' : 'bg-[#141414]/15'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${priv ? 'left-5' : 'left-1'}`} /></span>
          <span><span className="block font-extrabold text-sm">Private</span><span className={`block text-xs ${priv ? 'text-white/60' : 'text-[#141414]/50'}`}>Your /name shows nothing. Only Val introduces you.</span></span>
        </button>
      </section>

      {/* /vibe */}
      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <Eyebrow>Your /vibe</Eyebrow>
          {home.vibe && <Link href="/me/edit/" className="tap text-sm font-extrabold text-ob">Edit</Link>}
        </div>
        {home.vibe ? (
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-2 max-w-md">
              {home.vibe.photo_keys.slice(0, 3).map((k) => (
                <div key={k} className="aspect-[4/5] rounded-2xl bg-[#141414]/5 overflow-hidden">
                  {photos[k] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={photos[k]} alt="" className="w-full h-full object-cover" />}
                </div>
              ))}
            </div>
            <p className="text-sm text-[#141414]/65">{home.vibe.age} &middot; {home.vibe.neighborhood ?? 'Charleston'} &middot; {home.vibe.identity} seeking {home.vibe.seeking} &middot; {home.vibe.photo_keys.length} photos &middot; {home.vibe.voice_key ? 'voice in' : 'no voice yet'}</p>
          </div>
        ) : (
          <Link href="/apply/" className="block rounded-2xl border-2 border-dashed border-[#141414]/20 hover:border-ob px-5 py-6 font-extrabold">Start my /vibe &rarr;</Link>
        )}
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        <Link href={`/badge/?h=${h.handle}`} className="bg-ob text-white rounded-full px-6 py-3 font-extrabold">My badge + QR</Link>
        <Link href={`/${h.handle}`} className="border-2 border-[#141414] rounded-full px-6 py-3 font-extrabold">My /hey page</Link>
      </section>
    </AppShell>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-xs tracking-[0.18em] uppercase font-extrabold text-[#141414]/45 mb-3">{children}</div>
}

function Stat({ n, label, href, hot }: { n: number; label: string; href?: string; hot?: boolean }) {
  const inner = (
    <>
      <div className={`font-display font-extrabold text-4xl tabular-nums leading-none ${hot ? 'text-ob' : ''}`}>{n}</div>
      <div className="mt-2 text-xs font-extrabold tracking-[0.1em] uppercase text-[#141414]/50">{label}</div>
    </>
  )
  const cls = `rounded-2xl border-2 px-4 py-4 ${hot ? 'border-ob' : 'border-[#141414]/10'}`
  return href ? <Link href={href} className={`${cls} hover:border-[#141414]`}>{inner}</Link> : <div className={cls}>{inner}</div>
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-20 w-2/3 rounded-2xl bg-[#141414]/8" />
      <div className="mt-8 h-56 rounded-[28px] bg-[#141414]/8" />
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-[#141414]/5" />)}</div>
    </div>
  )
}
