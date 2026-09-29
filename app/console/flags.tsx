'use client'

// What Val caught: scams and money asks are held (the other person never sees
// them) until a person looks; softer things are just noted. Release puts a
// held thing back; Keep it held closes the flag and it stays gone.
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth'
import { Pill } from '../ui'

type F = { id: number; kind: 'message' | 'hey' | 'missed'; excerpt: string; reason: string; severity: 'watch' | 'hold'; source: 'pattern' | 'val'; at: string; handle: string | null }
const WHERE = { message: 'in a /chat', hey: 'in a /hey', missed: 'in a /missed note' }

export function ValFlags() {
  const [flags, setFlags] = useState<F[] | null>(null)
  const load = () => authClient()!.rpc('val_flags').then(({ data }) => setFlags((data as F[]) ?? []))
  useEffect(() => { load() }, [])
  async function settle(id: number, action: 'release' | 'confirm') {
    await authClient()!.rpc('val_settle_flag', { p_id: id, p_action: action }); load()
  }
  if (!flags) return null
  return (
    <section className="grid gap-2">
      <h2 className="font-display font-extrabold text-2xl">What Val caught</h2>
      {flags.length === 0 && <p className="text-sm text-[#141414]/60">Nothing waiting. Val screens every /hey note, /missed note and the first ten messages from each person in a /chat.</p>}
      {flags.map((f) => (
        <div key={f.id} className={`rounded-2xl p-4 border-2 ${f.severity === 'hold' ? 'border-ob' : 'border-[#141414]/10'}`}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${f.severity === 'hold' ? 'bg-ob text-white' : 'bg-[#141414]/10'}`}>{f.severity === 'hold' ? 'Held' : 'Noted'}</span>
            <span className="font-extrabold">{f.handle ? `/${f.handle}` : 'someone'}</span>
            <span className="text-[#141414]/60">{WHERE[f.kind]} · {f.reason} · {f.source === 'val' ? 'Val read it' : 'pattern'} · {new Date(f.at).toLocaleString()}</span>
          </div>
          <p className="mt-2 text-base">&ldquo;{f.excerpt}&rdquo;</p>
          <div className="mt-3 flex gap-2">
            {f.severity === 'hold'
              ? <><Pill onClick={() => settle(f.id, 'confirm')} primary>Keep it held</Pill><Pill onClick={() => settle(f.id, 'release')}>It&rsquo;s fine, release it</Pill></>
              : <Pill onClick={() => settle(f.id, 'confirm')}>Seen</Pill>}
          </div>
        </div>
      ))}
    </section>
  )
}
