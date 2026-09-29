'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { HANDLE_RE } from '@/lib/handles'

// GitHub Pages serves this for unknown paths, which lets /maya work as a
// short link: a single clean segment redirects to the /hey page.
export default function NotFound() {
  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]?.toLowerCase() ?? ''
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
    const depth = base ? parts.length - base.split('/').filter(Boolean).length : parts.length
    if (depth === 1 && HANDLE_RE.test(last)) {
      window.location.replace(`${base}/at/?h=${last}`)
    }
  }, [])

  return (
    <main className="page min-h-dvh flex flex-col bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 pb-12">
      <header className="pt-8 pb-10">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
      </header>
      <h1 className="font-display font-extrabold text-5xl tracking-[-0.03em]">Nothing here.</h1>
      <Link href="/" className="mt-8 underline font-semibold self-start">Back to /date</Link>
    </main>
  )
}
