'use client'

// /status: is /date wired? Booleans only, safe to share. What the phone
// itself reports (installed, service worker, push permission) sits next to
// what the server reports (Val's key, email, push keys).
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { wiring, type Wiring } from '@/lib/val'
import { useSession } from '@/lib/auth'
import { BASE, isStandalone } from '../pwa'

const SHA = (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || '').slice(0, 7)

type Row = { label: string; ok: boolean | null; note: string }

export default function StatusPage() {
  const { email, loading } = useSession()
  const [w, setW] = useState<Wiring | null | undefined>(undefined)
  const [sw, setSw] = useState<boolean | null>(null)
  const [perm, setPerm] = useState<string>('n/a')
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    wiring(getSupabase()).then((r) => setW(r))
    setInstalled(isStandalone())
    if ('Notification' in window) setPerm(Notification.permission)
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration(`${BASE}/`).then((r) => setSw(Boolean(r))).catch(() => setSw(false))
    else setSw(false)
  }, [])

  const server: Row[] = [
    { label: 'Database', ok: w === undefined ? null : w !== null, note: w === null ? 'The notify function did not answer.' : 'Supabase answered.' },
    { label: "Val's brain", ok: w ? w.anthropic : null, note: w?.anthropic ? 'Anthropic key found. Intros, reads and /briefs are hers.' : 'No Anthropic key. Val uses templates until one is set.' },
    { label: "Val's email", ok: w ? w.resend : null, note: w?.resend ? `Resend key found. Sending as ${w.from}.` : 'No Resend key. Nothing goes out.' },
    { label: 'Lock-screen push', ok: w ? w.push : null, note: w?.push ? 'Push keys present.' : 'No push keys yet.' },
  ]
  const phone: Row[] = [
    { label: 'Installed on this phone', ok: installed, note: installed ? 'Running from the home screen.' : 'Running in the browser. Add to Home Screen for the real thing.' },
    { label: 'Works offline', ok: sw, note: sw ? 'Service worker registered.' : 'No service worker yet. Reload once.' },
    { label: 'Notifications', ok: perm === 'granted' ? true : perm === 'denied' ? false : null, note: perm === 'granted' ? 'Allowed.' : perm === 'denied' ? 'Blocked in browser settings.' : 'Not asked yet. Log in and tap Turn on under /me.' },
    { label: 'Logged in', ok: loading ? null : Boolean(email), note: email ? `As ${email}.` : 'Not logged in.' },
  ]

  const dot = (ok: boolean | null) => ok === null ? 'bg-[#141414]/20' : ok ? 'bg-[#1DB954]' : 'bg-ob'
  const Block = ({ title, rows }: { title: string; rows: Row[] }) => (
    <section className="mt-8">
      <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob mb-3">{title}</div>
      <ul className="grid gap-3">
        {rows.map((r) => (
          <li key={r.label} className="flex items-start gap-3 border-b border-[#141414]/10 pb-3">
            <span className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${dot(r.ok)}`} />
            <div className="min-w-0">
              <div className="font-extrabold">{r.label}</div>
              <div className="text-sm text-[#141414]/60">{r.note}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )

  return (
    <main className="page min-h-dvh bg-white text-[#141414] px-6 sm:px-12 py-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs tracking-[0.2em] uppercase font-semibold text-[#141414]/50">status{SHA ? ` · ${SHA}` : ''}</span>
      </header>
      <h1 className="font-display font-extrabold text-4xl tracking-tight mt-8">Is it on?</h1>
      <p className="mt-2 text-[#141414]/60 max-w-md">Green is wired. Red is not. Grey is still checking or not asked yet.</p>
      <div className="max-w-xl">
        <Block title="Server" rows={server} />
        <Block title="This phone" rows={phone} />
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/console/" className="bg-[#141414] text-white rounded-full px-6 py-3 font-extrabold">Val&rsquo;s console</Link>
        <Link href="/me/" className="border-2 border-[#141414] rounded-full px-6 py-3 font-extrabold">/me</Link>
      </div>
    </main>
  )
}
