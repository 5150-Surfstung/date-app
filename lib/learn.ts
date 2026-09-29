'use client'

// Val learns. The app ranks with her learned weights, and tells her once per
// pair what a member was shown, so she can see later which signals led to a
// yes, a date and a /second. Nothing here is about who anyone is into; the
// hard filters never learn.
import { authClient } from './auth'
import { rpc } from './rest'
import type { Mults } from './match'

let cached: Promise<Mults> | null = null

/** Val's current multipliers (1 = starting weight, 0 = cut). Never blocks ranking: {} on failure. */
export function getMults(): Promise<Mults> {
  if (!cached) cached = rpc<Mults>('val_weights').then(({ data }) => data ?? {}).catch(() => ({}))
  return cached
}

const KEY = 'date-seen-logged'

/** Log what was shown, at most once a day per device; the database keeps one row per pair. */
export function logSeen(rows: { handle: string; score: number; features: Record<string, number> }[]) {
  if (!rows.length) return
  try {
    if (localStorage.getItem(KEY) === new Date().toDateString()) return
    localStorage.setItem(KEY, new Date().toDateString())
  } catch {}
  authClient()?.rpc('log_seen', { p: rows.slice(0, 300).map((r) => ({ handle: r.handle, score: r.score, f: r.features })) }).then(() => {}, () => {})
}
