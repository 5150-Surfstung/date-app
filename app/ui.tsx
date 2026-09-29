'use client'

// Chrome for the signed-in side of /date: white, ink, one red accent.
import Link from 'next/link'
import { useSession, signOut } from '@/lib/auth'
import Install from './install'
import Notes from './push'

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { email } = useSession()
  return (
    <main className="page min-h-dvh bg-white text-[#141414]">
      <header className="flex items-center justify-between gap-3 px-5 sm:px-12 py-4 sm:py-6 border-b border-[#141414]/10">
        <Link href="/" className="font-display font-extrabold text-2xl tracking-tight py-2">/date</Link>
        <nav className="flex items-center gap-1 sm:gap-3 text-sm font-semibold">
          <Link href="/pool/" className="px-2.5 py-2.5 rounded-full hover:text-ob">Pool</Link>
          <Link href="/inbox/" className="px-2.5 py-2.5 rounded-full hover:text-ob">Inbox</Link>
          <Link href="/chat/" className="px-2.5 py-2.5 rounded-full hover:text-ob">/chat</Link>
          <Link href="/me/" className="px-2.5 py-2.5 rounded-full hover:text-ob">/me</Link>
          {email ? (
            <button onClick={() => signOut().then(() => location.assign('/'))} className="px-2.5 py-2.5 text-[#141414]/50 hover:text-ob">Out</button>
          ) : (
            <Link href="/login/" className="bg-ob text-white rounded-full px-4 py-2.5 ml-1">Log in</Link>
          )}
        </nav>
      </header>
      <section className="px-5 sm:px-12 py-8 sm:py-10 max-w-5xl">
        <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob mb-2">{title}</div>
        {children}
        {email && <div className="mt-12 flex flex-col gap-4"><Install dark /><Notes dark /></div>}
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
