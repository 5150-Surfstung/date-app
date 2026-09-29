import Link from 'next/link'

export const metadata = { title: '/date — Terms' }

export default function Terms() {
  return (
    <main className="page min-h-dvh bg-white text-[#141414] px-6 sm:px-12 py-10">
      <Link href="/" className="font-display font-extrabold text-2xl tracking-tight">/date</Link>
      <article className="mt-10 max-w-2xl grid gap-5 text-base leading-relaxed">
        <h1 className="font-display font-extrabold text-4xl tracking-tight">The rules. Short on purpose.</h1>
        <p className="text-sm text-[#141414]/60">Draft for legal review.</p>
        <p><b>Be real.</b> Your photos are you. Your voice is you. Your age is your age. Fake anything and you&rsquo;re out.</p>
        <p><b>Be decent.</b> No harassment, no pressure, no showing up when someone said no. A &ldquo;no&rdquo; ends it.</p>
        <p><b>Show up.</b> Set a /date, keep it. Two no-shows and Val removes you from the pool.</p>
        <p><b>One /hey.</b> One per person per /name, ever.</p>
        <p><b>Safety first.</b> Report anyone who makes you uncomfortable. The person is removed first and questions come after. Meet at /spots &mdash; public, staffed, known.</p>
        <p><b>Season I is free for founding members.</b> Nothing is charged without telling you first, and never to see who likes you. That&rsquo;s not how this works.</p>
        <p><b>Who Val is.</b> Val is /date&rsquo;s matchmaker: software, including AI, that reads /vibes and suggests matches, with real people behind her making the calls that matter (approvals, safety, /spots).</p>
        <p><b>Val is not a promise.</b> She introduces; the rest is yours. We don&rsquo;t guarantee a match, a date, or a relationship.</p>
        <p><b>Your content.</b> You own it. You let /date use it to make introductions. Delete it any time.</p>
      </article>
    </main>
  )
}
