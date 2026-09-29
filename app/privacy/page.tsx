import Link from 'next/link'

export const metadata = { title: '/date — Privacy' }

export default function Privacy() {
  return (
    <main className="page min-h-dvh bg-white text-[#141414] px-6 sm:px-12 py-10">
      <Link href="/" className="font-display font-extrabold text-2xl tracking-tight">/date</Link>
      <article className="mt-10 max-w-2xl grid gap-5 text-base leading-relaxed">
        <h1 className="font-display font-extrabold text-4xl tracking-tight">Privacy, in plain words.</h1>
        <p className="text-sm text-[#141414]/60">Draft for legal review. This is what we do; a lawyer will make it a policy.</p>
        <p><b>What we collect.</b> Your /name, email, first name, age, neighborhood, who you are and who you&rsquo;re seeking, your eight answers, your photos, and your sixty-second voice note. At /spots: that you checked in, any &ldquo;I noticed someone&rdquo; or /missed note, and, if you check in by location, where your phone was at that moment. Location is read only when you tap &ldquo;I&rsquo;m here&rdquo; or open the app after allowing it. Never in the background.</p>
        <p><b>Who sees what.</b> Your /name page shows your /name, your /tag and your first name. Nothing else, to anyone. Your /vibe (answers, photos, voice) is shown only to a person you sent a /hey to, or who Val introduced you to, and photos the way you chose: all of them, just your lead, or none until you&rsquo;re talking. Nobody ever sees who is checked in anywhere.</p>
        <p><b>Val.</b> Val is our matchmaker: smart matchmaking software, including AI, with real people behind her who review every /vibe, every safety report and every /spot. Your /vibe is read by Val to make introductions. It is not sold, not used for ads, and not shared with anyone outside /date.</p>
        <p><b>How Val gets better.</b> Val keeps a note of who was shown to whom and how far it went (a /hey, both saying yes, a date, a /second), and uses it only in aggregate to learn which parts of her matching actually work. It never changes who you&rsquo;re shown to or who you want; those are yours. It goes when you delete your account.</p>
        <p><b>Debriefs.</b> What you tell Val after a date is private. It is never shown to the other person.</p>
        <p><b>Reports.</b> If you report someone, Val sees it. They don&rsquo;t.</p>
        <p><b>Your copy.</b> /me &rarr; Settings &rarr; Download my data gives you everything /date holds about you, in one file, any time.</p>
        <p><b>If /date changes hands.</b> If /date is ever sold or merged, your account moves with it under this same policy. You&rsquo;ll be told first, with the chance to delete everything before it does.</p>
        <p><b>Deleting.</b> /me &rarr; Settings &rarr; Leave /date deletes your /name, answers, photos, voice, /heys and /chats immediately. Reports other members filed about you are kept, detached from your /name, so Val can keep people safe. Or email hello@surfstung.com and a person does it for you.</p>
        <p><b>Email.</b> Every email from Val has a one-tap stop. Safety check-ins you asked for always come through.</p>
        <p><b>Where it lives.</b> Supabase (database and files, US) and Vercel (the site). Email is sent by Resend.</p>
        <p><b>Age.</b> 18 and over. No exceptions.</p>
      </article>
    </main>
  )
}
