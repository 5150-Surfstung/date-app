'use client'

// Val's Read: who you are, in three lines. Fetched from the database; when
// Val owes you a fresh one (no read yet, or new debriefs), her brain writes it.
import { useCallback, useEffect, useState } from 'react'
import { authClient } from './auth'
import { askVal } from './val'

export type Read = { text: string; at: string; ai: boolean; n: number }
export type ReadState = { has_vibe: boolean; read: Read | null; previous: { text: string; at: string } | null; debriefs: number; due: boolean }

/** Ask Val's brain for a fresh read if one is owed. Safe to fire and forget. */
export async function refreshRead(): Promise<void> {
  const c = authClient()
  if (!c) return
  const { data } = await c.rpc('my_read')
  if ((data as ReadState | null)?.due) await askVal(c, { kind: 'read_me' })
}

export function useRead() {
  const [state, setState] = useState<ReadState | null | undefined>(undefined)
  const [writing, setWriting] = useState(false)
  const load = useCallback(async () => {
    const c = authClient()
    if (!c) { setState(null); return }
    const { data } = await c.rpc('my_read')
    let s = (data as ReadState | null) ?? null
    if (s?.due) {
      setWriting(true)
      await askVal(c, { kind: 'read_me' })
      s = ((await c.rpc('my_read')).data as ReadState | null) ?? s
      setWriting(false)
    }
    setState(s)
  }, [])
  useEffect(() => { load() }, [load])
  return { state, writing, reload: load }
}
