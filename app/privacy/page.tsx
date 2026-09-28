import Link from 'next/link'

export const metadata = { title: '/date — Privacy' }

export default function Privacy() {
  return (
    <main className="page min-h-dvh bg-white text-[#141414] px-6 sm:px-12 py-10">
      <Link href="/" className="font-display font-extrabold text-2xl tracking-tight">/date</Link>
      <article className="mt-10 max-w-2xl grid gap-5 text-base leading-relaxed">
        <h1 className="font-display font-extrabold text-4xl tracking-tight">Privacy, in plain words.</h1>
        <p className="text-sm text-[#141414]/60">Draft for legal review. This is what we do; a lawyer will make it a policy.</p>
        <p><b>What we collect.</b> Your /name, email, first name, age, neighborhood, who you are and who you&rsquo;re seeking, your eight answers, your photos, and your sixty-second voice note. At /spots: that you scanned in, and any &ldquo;I noticed someone&rdquo; note.</p>
        <p><b>Who sees what.</b> Your /name page shows your /name, your /tag and your first name. Nothing else, to anyone. Your /vibe (answers, photos, voice) is shown only to a person you sent a /hey to, or who Val introduced you to, and photos only after you&rsquo;ve both written in a /chat. Nobody ever sees who is checked in anywhere.</p>
        <p><b>Val.</b> Val is our matchmaker &mdash; software plus a human. Your /vibe is read by Val to make introductions. It is not sold, not used for ads, and not shared with anyone outside /date.</p>
        <p><b>Debriefs.</b> What you tell Val after a date is private. It is never shown to the other person.</p>
        <p><b>Reports.</b> If you report someone, Val sees it. They don&rsquo;t.</p>
        <p><b>Deleting.</b> Email hello@surfstung.com from the address on your /name and everything &mdash; answers, photos, voice, /heys, /chats &mdash; is deleted.</p>
        <p><b>Where it lives.</b> Supabase (database and files, US) and Vercel (the site). Email is sent by Resend.</p>
        <p><b>Age.</b> 18 and over. No exceptions.</p>
      </article>
    </main>
  )
}
