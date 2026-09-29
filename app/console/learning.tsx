'use client'

// What Val has learned: every signal she weighs, how much it counts now, and
// why. She moves weights a little each night toward what actually leads to a
// yes, a date and a /second, and cuts what predicts nothing. A person can hold
// any weight, or hand it back to her.
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth'
import { Pill } from '../ui'

type W = { signal: string; label: string; mult: number; state: string; r: number | null; r_last: number | null; n: number | null; n_pos: number | null; held: boolean; note: string | null }
type C = { signal: string; from_mult: number; to_mult: number; why: string; by: string; created_at: string }
type L = { weights: W[]; changes: C[]; seen: number; mature: number }

const STATE: Record<string, [string, string]> = {
  learning: ['Learning', 'bg-[#141414]/10'], boosted: ['Counts more', 'bg-ob text-white'], steady: ['Earning its keep', 'bg-[#141414] text-white'],
  trimmed: ['Trimmed', 'bg-[#141414]/20'], cut: ['Cut', 'bg-[#141414]/5 text-[#141414]/50 line-through'], held: ['Held by you', 'border-2 border-[#141414]'],
}

export function LearningTab() {
  const [l, setL] = useState<L | null | undefined>(undefined)
  const load = () => authClient()!.rpc('val_learning').then(({ data }) => setL(data as L | null))
  useEffect(() => { load() }, [])
  async function hold(signal: string, on: boolean, mult?: number) {
    await authClient()!.rpc('val_hold_weight', { p_signal: signal, p_hold: on, p_mult: mult ?? null })
    load()
  }
  if (l === undefined) return <p className="mt-6 text-sm">Loading…</p>
  if (!l) return <p className="mt-6 text-sm">Val only.</p>
  const byName = Object.fromEntries(l.weights.map((w) => [w.signal, w.label]))
  return (
    <div className="mt-6 grid gap-8 max-w-4xl">
      <p className="text-sm text-[#141414]/70 max-w-2xl">
        Every night Val checks each signal against what really happened: who said yes, who met, who came back for a /second.
        What predicts gets more weight; what predicts nothing gets cut. Moves are small (at most 0.1 a night) and need at least
        400 pairs and 30 mutual yeses before she touches anything. Who someone wants and their age range are hard rules and never learn.
      </p>
      <div className="text-sm font-semibold">{l.seen.toLocaleString()} pairs shown so far · {l.mature.toLocaleString()} old enough to judge (a week+)</div>
      <div className="grid gap-2">
        {l.weights.map((w) => {
          const [label, cls] = STATE[w.held ? 'held' : w.state] ?? STATE.learning
          return (
            <div key={w.signal} className="rounded-2xl border-2 border-[#141414]/10 p-4 grid sm:grid-cols-[1fr_auto] gap-3 items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold">{w.label}</span>
                  <span className={`text-xs font-extrabold rounded-full px-2.5 py-0.5 ${cls}`}>{label}</span>
                  <span className="text-sm tabular-nums">× {w.mult.toFixed(2)}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-[#141414]/10 max-w-xs"><div className="h-full rounded-full bg-ob" style={{ width: `${Math.min(100, (w.mult / 2) * 100)}%` }} /></div>
                {w.note && <p className="mt-2 text-sm text-[#141414]/60">{w.note}</p>}
              </div>
              <div className="flex gap-2">
                {w.held
                  ? <Pill onClick={() => hold(w.signal, false)}>Let Val learn</Pill>
                  : <>
                      <Pill onClick={() => hold(w.signal, true)}>Hold here</Pill>
                      {w.mult !== 1 && <Pill onClick={() => hold(w.signal, true, 1)}>Reset to 1</Pill>}
                    </>}
              </div>
            </div>
          )
        })}
      </div>
      <section>
        <h2 className="font-display font-extrabold text-2xl">Every change</h2>
        {l.changes.length === 0 ? <p className="mt-2 text-sm">Nothing yet. Val needs real dates before she changes anything.</p> : (
          <ul className="mt-3 grid gap-1.5 text-sm">
            {l.changes.map((c, i) => (
              <li key={i}><span className="text-[#141414]/50">{new Date(c.created_at).toLocaleDateString()}</span> · <b>{byName[c.signal] ?? c.signal}</b> {c.from_mult.toFixed(2)} → {c.to_mult.toFixed(2)} · {c.why}{c.by !== 'val' ? ` (${c.by})` : ''}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
