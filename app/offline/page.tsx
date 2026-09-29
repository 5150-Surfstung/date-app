import Link from 'next/link'

export const metadata = { title: 'Offline — /date' }

export default function Offline() {
  return (
    <main className="page min-h-dvh flex flex-col bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 py-8">
      <Link href="/" className="self-start font-display font-extrabold text-3xl tracking-tight">/date</Link>
      <div className="my-auto max-w-md">
        <h1 className="font-display font-extrabold text-5xl tracking-tight leading-[0.95]">You&rsquo;re offline.</h1>
        <p className="mt-5 text-lg text-[#141414]/70">Nothing here needs a signal to keep. Your /name is still yours, your chats are still open, and Val is still looking.</p>
        <p className="mt-3 text-[#141414]/50">Come back when you&rsquo;re on again.</p>
        <Link href="/inbox/" className="inline-block mt-8 bg-ob text-white rounded-full px-8 py-4 font-extrabold">Try again</Link>
      </div>
    </main>
  )
}
