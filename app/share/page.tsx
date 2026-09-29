'use client'

// Make a vibe card. No login needed; if you have a /name, the QR is yours.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HANDLE_KEY, TAGS, cleanVibe } from '@/lib/handles'
import { VibeInput, LocalChips } from '../tags'
import { ShareButton } from '../share'

export default function SharePage() {
  const [vibe, setVibe] = useState('tacos')
  const [handle, setHandle] = useState<string | null>(null)
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('v')
    if (v && cleanVibe(v)) setVibe(cleanVibe(v))
    try { setHandle(localStorage.getItem(HANDLE_KEY)) } catch {}
  }, [])
  return (
    <main className="page min-h-dvh bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 pb-16">
      <header className="flex items-center justify-between pt-8 pb-10">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">Vibe card</span>
      </header>
      <section className="max-w-xl">
        <h1 className="font-display font-extrabold text-5xl sm:text-6xl leading-[0.95] tracking-[-0.04em]">What&rsquo;s your vibe tonight?</h1>
        <p className="mt-4 text-lg text-[#141414]/70">Pick one or make your own. Share the card to your story{handle ? `; the QR sends people to /${handle}` : ''}.</p>
        <div className="mt-8 font-display font-extrabold text-6xl sm:text-7xl tracking-[-0.04em] text-ob break-all">/{vibe}</div>
        <div className="mt-6 flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <button key={t.value} onClick={() => setVibe(t.value)} className={`rounded-full px-4 py-2 text-sm font-extrabold ${vibe === t.value ? 'bg-[#141414] text-white' : 'border-2 border-[#141414]/15'}`}>/{t.value}</button>
          ))}
        </div>
        <div className="mt-5"><LocalChips onPick={setVibe} active={vibe} /></div>
        <div className="mt-4"><VibeInput onAdd={setVibe} placeholder="or make your own" /></div>
        <div className="mt-8">
          <ShareButton vibe={vibe} handle={handle} label="Make my card" className="bg-ob text-white rounded-full px-10 py-5 text-lg font-extrabold" />
        </div>
        {!handle && <p className="mt-6 text-sm text-[#141414]/60">No /name yet? <Link href="/claim/" className="underline font-semibold">Claim one</Link> and your card will point to it.</p>}
      </section>
    </main>
  )
}
