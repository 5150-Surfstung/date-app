'use client'

// The System tab: what's wired, and one-tap tests that hit the real
// pipes. Email me, push me, ask Val for a line. Admin only (the notify
// function checks the caller against date_admins for `test`).
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth'
import { askVal, notifyNow, wiring, type Wiring } from '@/lib/val'
import { DEMO_CREW } from '@/lib/demo'
import { Pill } from '../ui'

export default function System({ email }: { email: string }) {
  const [w, setW] = useState<Wiring | null | undefined>(undefined)
  const [out, setOut] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => { wiring(authClient()).then(setW) }, [])

  async function run(key: string, fn: () => Promise<string>) {
    setBusy(key)
    try { setOut((o) => ({ ...o, [key]: '' })); const r = await fn(); setOut((o) => ({ ...o, [key]: r })) }
    catch (e) { setOut((o) => ({ ...o, [key]: e instanceof Error ? e.message : 'Failed.' })) }
    finally { setBusy(null) }
  }

  const testEmail = () => run('email', async () => {
    const r = await notifyNow(authClient(), { kind: 'test', what: 'email' })
    if (!r) return 'The function did not answer.'
    if (r.error) return `Refused: ${r.error}`
    return r.sent ? `Sent to ${email}. Check the inbox (and spam, once).` : 'Resend said no. Key present but the send failed. Until /date has its own domain, Resend only delivers to the account owner’s address.'
  })
  const testPush = () => run('push', async () => {
    const r = await notifyNow(authClient(), { kind: 'test', what: 'push' })
    if (!r) return 'The function did not answer.'
    if (r.error) return `Refused: ${r.error}`
    const n = Number(r.pushed ?? 0)
    return n > 0 ? `Pushed to ${n} device${n === 1 ? '' : 's'}. Look at your lock screen.` : 'No devices subscribed for this email. On your phone: install /date, log in, open /me, tap Turn on.'
  })
  const testVal = () => run('val', async () => {
    const p = DEMO_CREW[0]
    const r = await askVal(authClient()!, { kind: 'read', person: { handle: p.handle, name: p.name, tag: p.tag, age: p.age, hood: p.hood, vibe: p.vibe } })
    if (typeof r.error === 'string') return `Refused: ${r.error}`
    return typeof r.text === 'string' && r.text ? r.text : 'Empty. Val has no Anthropic key, so she answers with templates only.'
  })

  const light = (ok: boolean | null | undefined) => ok == null ? 'bg-[#141414]/20' : ok ? 'bg-[#1DB954]' : 'bg-ob'
  const rows: [string, boolean | null | undefined, string][] = [
    ['Database', w === undefined ? null : w !== null, w === null ? 'notify did not answer' : 'answering'],
    ["Val's brain (Anthropic)", w?.anthropic, w?.anthropic ? 'key found' : 'no key: set ANTHROPIC_API_KEY as a function secret, or hand it to me for Vault'],
    ["Val's email (Resend)", w?.resend, w ? `key found · from ${w.from}` : ''],
    ['Lock-screen push', w?.push, w?.push ? 'VAPID pair in Vault' : 'no keys'],
  ]

  return (
    <div className="mt-6 grid gap-8 max-w-2xl">
      <section>
        <div className="text-xs uppercase tracking-[0.15em] text-[#141414]/50 mb-3">Wired</div>
        <ul className="grid gap-2">
          {rows.map(([label, ok, note]) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span className={`w-3 h-3 rounded-full shrink-0 ${light(ok)}`} />
              <span className="font-extrabold">{label}</span>
              <span className="text-[#141414]/50">{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4">
        <div className="text-xs uppercase tracking-[0.15em] text-[#141414]/50">Tests · they hit the real pipes, to you only</div>
        {[
          ['email', 'Email me', 'Val sends one line to this address.', testEmail],
          ['push', 'Push me', 'Val sends one note to every device subscribed on this email.', testPush],
          ['val', `Ask Val about /${DEMO_CREW[0].handle}`, 'Her two-line read of a demo profile. Blank means no key.', testVal],
        ].map(([key, label, sub, fn]) => (
          <div key={key as string} className="border-2 border-[#141414]/10 rounded-2xl p-4 grid sm:grid-cols-[auto_1fr] gap-3 items-start">
            <Pill primary onClick={fn as () => void} disabled={busy === key}>{busy === key ? 'One sec…' : (label as string)}</Pill>
            <div className="text-sm">
              <div className="text-[#141414]/60">{sub as string}</div>
              {out[key as string] && <div className="mt-2 whitespace-pre-wrap font-medium">{out[key as string]}</div>}
            </div>
          </div>
        ))}
      </section>

      <section className="text-sm grid gap-2">
        <div className="text-xs uppercase tracking-[0.15em] text-[#141414]/50">Test drive, start to finish</div>
        <ol className="list-decimal pl-5 grid gap-1.5 text-[#141414]/80">
          <li>On your phone, open the site, Add to Home Screen, open it from there.</li>
          <li>Log in with this email. Open /me, tap <b>Turn on</b> for lock-screen notes.</li>
          <li>Claim a second /name with another email you own. Send it a /hey from the first.</li>
          <li>The second email gets Val&rsquo;s note and a push. Say yes in its inbox. A /chat opens with the 48-hour clock.</li>
          <li>Set a date and a /check time. The clock job mails and pushes both sides on the minute.</li>
          <li>Pairs tab: pair two demo /names to watch the intro flow without a second phone.</li>
        </ol>
        <p className="text-[#141414]/50 mt-2">Public version of the top lights: <a className="underline" href="/status/">/status</a>. If a login link lands you on the wrong site, the Vercel URL isn&rsquo;t in Supabase&rsquo;s auth redirect list yet.</p>
      </section>
    </div>
  )
}
