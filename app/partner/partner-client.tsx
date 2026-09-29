'use client'

// Venues apply to be a /date spot here, on their own or from a rep's link or QR
// (?rep=code). Nothing goes live until Val's people approve it.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { rpc } from '@/lib/rest'
import { SPOT_KINDS } from '@/lib/venues'

const HOW = [
  ['Guests scan in', 'A small QR at your door or on the tables. Singles on /date scan it when they arrive.'],
  ['Val makes the intro', 'If someone else in the room is on /date and it’s mutual, Val introduces them. Nobody has to walk over.'],
  ['Dates come to you', 'When Val sets two people up, she can suggest your place for the first date.'],
  ['A /night, if you want one', 'Once a month, a room full of verified singles. You choose whether to host.'],
] as const

const STANDARDS = [
  'A public place with staff on site during open hours.',
  'Welcoming to everyone: every orientation, background and body.',
  'You’ll tell us if a guest ever makes someone feel unsafe.',
  'No paying for placement or matches. Val picks people, not sponsors.',
  'We can pause a spot at any time if something’s off.',
]

const field = 'w-full border-2 border-[#141414]/15 focus:border-ob outline-none rounded-2xl px-4 py-3 text-base bg-white'

export default function PartnerClient() {
  const [rep, setRep] = useState<{ code: string; name: string } | null>(null)
  const [f, setF] = useState({
    name: '', kind: 'bar', area: '', address: '', website: '', instagram: '', tiktok: '', hours: '', about: '', contact_name: '', contact_role: '',
    contact_email: '', contact_phone: '', perk: '', pitch: '', night_ok: false, standards_ok: false, company_site: '',
  })
  const [state, setState] = useState<'form' | 'sending' | 'done'>('form')
  const [error, setError] = useState<string | null>(null)

  // A rep's link or QR carries their code; show who sent them.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('rep')?.toLowerCase()
    if (!code) return
    rpc<string | null>('public_rep', { p_code: code }).then(({ data }) => { if (data) setRep({ code, name: data }) })
  }, [])

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!f.standards_ok) { setError('Tick the standards box to apply.'); return }
    setState('sending')
    const { data, error } = await rpc<string>('date_spot_apply', { p: { ...f, rep: rep?.code ?? null } })
    if (data === 'ok') { setState('done'); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    setState('form')
    setError(
      data === 'name' ? 'Add your venue’s name.' :
      data === 'email' ? 'That email doesn’t look right.' :
      data === 'contact' ? 'Add your name.' :
      data === 'dupe' ? 'We already have an application from this email. We’ll be in touch.' :
      data === 'slow' || data === 'busy' ? 'Lots of applications right now. Try again in a bit.' :
      error ? 'Couldn’t reach us. Check your connection and try again.' : 'Something went wrong. Try again.')
  }

  if (state === 'done') {
    return (
      <main className="page min-h-dvh flex flex-col bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 py-8">
        <Link href="/" className="self-start font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <div className="my-auto max-w-lg">
          <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">Application in</div>
          <h1 className="mt-3 font-display font-extrabold text-5xl sm:text-6xl leading-[0.95] tracking-[-0.035em]">Thanks. A person reads every one.</h1>
          <p className="mt-6 text-lg text-[#141414]/75 leading-relaxed">
            We only list places we&rsquo;d send our own friends, so every spot is reviewed before it goes live. You&rsquo;ll hear back at {f.contact_email || 'your email'} either way, usually within two days.
          </p>
          <p className="mt-4 text-lg text-[#141414]/75">If you&rsquo;re approved, you&rsquo;ll get your page and a printable QR kit by email.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="page min-h-dvh bg-[#FFF3EA] text-[#141414] px-6 sm:px-12 pb-16">
      <header className="flex items-center justify-between pt-8 pb-10">
        <Link href="/" className="font-display font-extrabold text-3xl tracking-tight">/date</Link>
        <span className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">For venues</span>
      </header>

      <section className="max-w-3xl">
        {rep && <div className="mb-6 inline-block rounded-full bg-[#141414] text-white text-sm font-semibold px-4 py-2">{rep.name} from /date sent you this</div>}
        <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-[-0.04em]">Make your place a /date spot.</h1>
        <p className="mt-6 text-xl leading-snug text-[#141414]/75 max-w-2xl">
          /date is matchmaking for Charleston, with a matchmaker named Val. Every member is verified. Your place is where they meet.
        </p>
      </section>

      <section className="mt-14 grid sm:grid-cols-2 gap-4 max-w-4xl">
        {HOW.map(([t, d], i) => (
          <div key={t} className="rounded-3xl bg-white p-6">
            <div className="font-display font-extrabold text-4xl text-ob leading-none tabular-nums">0{i + 1}</div>
            <div className="mt-3 font-display font-extrabold text-2xl tracking-tight">{t}</div>
            <p className="mt-2 text-base text-[#141414]/70 leading-relaxed">{d}</p>
          </div>
        ))}
      </section>
      <p className="mt-6 text-base text-[#141414]/70 max-w-2xl">Nothing to install, and your staff don&rsquo;t have to do anything.</p>

      <section className="mt-14 max-w-3xl rounded-3xl bg-[#141414] text-white p-6 sm:p-8">
        <div className="text-xs tracking-[0.2em] uppercase font-semibold text-ob">Every spot is approved by a person</div>
        <p className="mt-3 text-lg text-white/80">We keep the list short on purpose. To be a /date spot:</p>
        <ul className="mt-4 grid gap-2 text-base">
          {STANDARDS.map((s) => <li key={s} className="flex gap-3"><span className="text-ob font-extrabold">/</span>{s}</li>)}
        </ul>
      </section>

      <form onSubmit={submit} className="mt-14 max-w-2xl grid gap-4" noValidate>
        <h2 className="font-display font-extrabold text-4xl tracking-[-0.03em]">Apply</h2>

        {/* Honeypot: people never see it; bots fill it in. */}
        <input type="text" name="company_site" value={f.company_site} onChange={set('company_site')} tabIndex={-1} autoComplete="off" aria-hidden
          className="absolute left-[-9999px] w-px h-px opacity-0" />

        <Label text="Venue name" required><input className={field} value={f.name} onChange={set('name')} required maxLength={80} autoComplete="organization" /></Label>
        <div className="grid sm:grid-cols-2 gap-4">
          <Label text="What kind of place">
            <select className={field} value={f.kind} onChange={set('kind')}>
              {SPOT_KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Label>
          <Label text="Neighborhood"><input className={field} value={f.area} onChange={set('area')} placeholder="e.g. Upper King" maxLength={80} /></Label>
        </div>
        <Label text="Address"><input className={field} value={f.address} onChange={set('address')} maxLength={160} autoComplete="street-address" /></Label>
        <Label text="One line about you (goes on your /date card)"><input className={field} value={f.about} onChange={set('about')} placeholder="Oysters, natural wine, a patio made for first dates" maxLength={200} /></Label>
        <div className="grid sm:grid-cols-2 gap-4">
          <Label text="Website"><input className={field} value={f.website} onChange={set('website')} maxLength={160} inputMode="url" /></Label>
          <Label text="Hours"><input className={field} value={f.hours} onChange={set('hours')} placeholder="Daily 4pm–2am" maxLength={120} /></Label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Label text="Instagram"><input className={field} value={f.instagram} onChange={set('instagram')} placeholder="@yourspot" maxLength={80} /></Label>
          <Label text="TikTok"><input className={field} value={f.tiktok} onChange={set('tiktok')} placeholder="@yourspot" maxLength={80} /></Label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Label text="Your name" required><input className={field} value={f.contact_name} onChange={set('contact_name')} required maxLength={80} autoComplete="name" /></Label>
          <Label text="Your role"><input className={field} value={f.contact_role} onChange={set('contact_role')} placeholder="Owner, GM…" maxLength={60} /></Label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Label text="Email" required><input className={field} type="email" value={f.contact_email} onChange={set('contact_email')} required autoComplete="email" /></Label>
          <Label text="Phone"><input className={field} type="tel" value={f.contact_phone} onChange={set('contact_phone')} maxLength={30} autoComplete="tel" /></Label>
        </div>

        <Label text="Anything for couples Val sends your way? (optional)">
          <input className={field} value={f.perk} onChange={set('perk')} placeholder="e.g. a quiet table, first round on the house" maxLength={280} />
        </Label>
        <Label text="Why /date? (optional)">
          <textarea className={field} rows={3} value={f.pitch} onChange={set('pitch')} maxLength={600} />
        </Label>

        <label className="flex gap-3 items-start text-base cursor-pointer">
          <input type="checkbox" checked={f.night_ok} onChange={set('night_ok')} className="mt-1 w-5 h-5 accent-[#FF3B2F]" />
          <span>We&rsquo;d be open to hosting a monthly /night.</span>
        </label>
        <label className="flex gap-3 items-start text-base cursor-pointer">
          <input type="checkbox" checked={f.standards_ok} onChange={set('standards_ok')} className="mt-1 w-5 h-5 accent-[#FF3B2F]" />
          <span>We meet the standards above, and we understand /date can pause a spot at any time.</span>
        </label>

        {error && <p className="text-ob font-semibold" role="alert">{error}</p>}
        <button type="submit" disabled={state === 'sending'}
          className="mt-2 bg-ob text-white rounded-full px-10 py-5 text-lg font-extrabold disabled:opacity-50 sm:justify-self-start">
          {state === 'sending' ? 'Sending…' : 'Apply to be a /date spot'}
        </button>
        <p className="text-sm text-[#141414]/55">We only use these details to review your application and reach you about it. <Link href="/privacy/" className="underline">Privacy</Link></p>
      </form>
    </main>
  )
}

function Label({ text, required, children }: { text: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-extrabold">{text}{required && <span className="text-ob"> *</span>}</span>
      {children}
    </label>
  )
}
