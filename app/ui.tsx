'use client'

// Chrome for the signed-in side of /date: white, ink, one red accent.
import Link from 'next/link'
import { useSession, signOut } from '@/lib/auth'

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { email } = useSession()
  return (
    <main className="min-h-screen bg-white text-[#141414]">
      <header className="flex items-center justify-between px-6 sm:px-12 py-6 border-b border-[#141414]/10">
        <Link href="/" className="font-display font-extrabold text-2xl tracking-tight">/date</Link>
        <nav className="flex items-center gap-5 text-sm font-semibold">
          <Link href="/inbox/" className="hover:text-ob">Inbox</Link>
          <Link href="/chat/" className="hover:text-ob">/chat</Link>
          {email ? (
            <button onClick={() => signOut().then(() => location.assign('/'))} className="text-[#141414]/50 hover:text-ob">Sign out</button>
          ) : (
            <Link href="/login/" className="bg-ob text-white rounded-full px-4 py-2">Log in</Link>
          )}
        </nav>
      </header>
      <section className="px-6 sm:px-12 py-10 max-w-5xl">
        <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob mb-2">{title}</div>
        {children}
      </section>
    </main>
  )
}

export function Pill({ children, onClick, primary, disabled }: { children: React.ReactNode; onClick?: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-full px-5 py-2.5 text-sm font-extrabold transition disabled:opacity-40 ${primary ? 'bg-ob text-white hover:brightness-110' : 'border-2 border-[#141414] hover:bg-[#141414] hover:text-white'}`}>
      {children}
    </button>
  )
}

export function NeedLogin() {
  return (
    <div className="max-w-md">
      <h1 className="font-display font-extrabold text-4xl tracking-tight">Log in first.</h1>
      <p className="mt-3 text-base text-[#141414]/70">Use the email on your /name. We&rsquo;ll send a link, no password.</p>
      <Link href="/login/" className="inline-block mt-6 bg-ob text-white rounded-full px-7 py-3.5 font-extrabold">Log in</Link>
    </div>
  )
}
