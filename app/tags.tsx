'use client'

// Vibes: tap a core word or make your own. Up to three, the first leads.
// Change them whenever. One picker for claim and /me.
import { useEffect, useState } from 'react'
import { TAGS, LOCAL, cleanVibe, vibeProblem, type Tag } from '@/lib/handles'
import { rpc } from '@/lib/rest'

export const MAX_TAGS = 3

let popularCache: string[] | null = null
/** What people are using right now (for suggestions as you type). */
export function usePopularVibes() {
  const [list, setList] = useState<string[]>(popularCache ?? [])
  useEffect(() => {
    if (popularCache) return
    rpc<{ vibe: string; n: number }[]>('date_popular_vibes').then(({ data }) => {
      popularCache = (data ?? []).map((d) => d.vibe)
      setList(popularCache)
    })
  }, [])
  return list
}

/** Type a vibe; suggests ones people already use so we find each other. */
export function VibeInput({ onAdd, placeholder = 'make your own', disabled }: { onAdd: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  const [text, setText] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const popular = usePopularVibes()
  const v = cleanVibe(text)
  const core = [...TAGS.map((t) => t.value as string), ...LOCAL.map((l) => l.value)]
  const suggest = v.length >= 1
    ? Array.from(new Set([...popular, ...core])).filter((p) => p.startsWith(v) && p !== v).slice(0, 5)
    : []
  function add(word: string) {
    const w = cleanVibe(word)
    const problem = vibeProblem(w)
    if (problem) { setErr(problem); return }
    onAdd(w); setText(''); setErr(null)
  }
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center border-2 border-[#141414]/15 focus-within:border-ob rounded-full bg-white pl-4">
          <span className="font-display font-extrabold text-lg text-ob">/</span>
          <input value={text} disabled={disabled} maxLength={24}
            onChange={(e) => { setText(e.target.value); setErr(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (v) add(v) } }}
            placeholder={placeholder} autoCapitalize="none" autoCorrect="off" spellCheck={false}
            className="flex-1 min-w-0 bg-transparent outline-none px-1 py-2.5 text-base font-semibold" />
        </div>
        <button type="button" onClick={() => v && add(v)} disabled={!v || disabled}
          className="rounded-full bg-[#141414] text-white px-5 py-3 text-sm font-extrabold disabled:opacity-30">Add</button>
      </div>
      {suggest.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggest.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-full bg-[#141414]/[0.06] px-3 py-1.5 text-sm font-bold">/{s}</button>
          ))}
        </div>
      )}
      {err && <p className="text-sm font-semibold text-ob">{err}</p>}
    </div>
  )
}

export function TagPicker({ value, onChange, disabled }: { value: Tag[]; onChange: (t: Tag[]) => void; disabled?: boolean }) {
  const [full, setFull] = useState(false)
  function tap(t: Tag) {
    if (value.includes(t)) { onChange(value.filter((x) => x !== t)); setFull(false); return }
    if (value.length >= MAX_TAGS) { setFull(true); return }
    onChange([...value, t]); setFull(false)
  }
  function lead(t: Tag) { onChange([t, ...value.filter((x) => x !== t)]) }
  const custom = value.filter((v) => !TAGS.some((t) => t.value === v))

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {[...TAGS.map((t) => ({ value: t.value as string, line: t.line })), ...custom.map((c) => ({ value: c, line: 'Your own.' }))].map((t) => {
          const i = value.indexOf(t.value)
          const on = i >= 0
          return (
            <button key={t.value} type="button" disabled={disabled} onClick={() => tap(t.value)} title={t.line}
              className={`relative pl-4 pr-4 py-2.5 border-2 rounded-full text-base font-extrabold transition-colors disabled:opacity-50 ${
                on ? (i === 0 ? 'bg-ob text-white border-ob' : 'bg-[#141414] text-white border-[#141414]')
                   : value.length >= MAX_TAGS ? 'border-[#141414]/10 text-[#141414]/35' : 'border-[#141414]/15 hover:border-[#141414]'}`}>
              /{t.value}
              {on && <span className={`absolute -top-2 -right-1.5 w-5 h-5 rounded-full grid place-items-center text-[11px] font-extrabold ${i === 0 ? 'bg-[#141414] text-white' : 'bg-ob text-white'}`}>{i + 1}</span>}
            </button>
          )
        })}
      </div>

      {value.length < MAX_TAGS && <VibeInput disabled={disabled} onAdd={(w) => { if (!value.includes(w)) onChange([...value, w]) }} />}

      {value.length > 0 ? (
        <div className="rounded-2xl bg-white border-2 border-[#141414]/10 px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-display font-extrabold text-2xl text-ob">/{value[0]}</span>
            {value.slice(1).map((t) => (
              <span key={t} className="font-display font-extrabold text-lg text-[#141414]/60">
                /{t}
                <button type="button" onClick={() => lead(t)} disabled={disabled} className="ml-1 align-middle text-xs font-bold text-ob underline underline-offset-2 px-1.5 py-2">make lead</button>
              </span>
            ))}
          </div>
          <p className="mt-1 text-sm text-[#141414]/60">{TAGS.find((t) => t.value === value[0])?.line ?? 'Your own. Change it whenever.'}</p>
        </div>
      ) : null}

      <p className={`text-sm ${full ? 'font-semibold text-ob' : 'text-[#141414]/55'}`}>
        {full ? 'Three max. Tap one to drop it first.' : 'Pick or make your own, up to three. The first one leads. Change them whenever.'}
      </p>
    </div>
  )
}

/** A person's words: the lead big, the rest quieter. */
export function TagLine({ tags, tag, big }: { tags?: string[] | null; tag?: string | null; big?: boolean }) {
  const t = tags?.length ? tags : tag ? [tag] : []
  if (!t.length) return null
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={`text-ob ${big ? '' : ''}`}>/{t[0]}</span>
      {t.slice(1).map((x) => <span key={x} className="opacity-50 text-[0.7em]">/{x}</span>)}
    </span>
  )
}

/** Charleston place slashes, one tap each. */
export function LocalChips({ onPick, active, dark }: { onPick: (v: string) => void; active?: string | null; dark?: boolean }) {
  return (
    <div className="grid gap-2">
      <div className={`text-xs tracking-[0.2em] uppercase font-semibold ${dark ? 'text-white/50' : 'text-[#141414]/50'}`}>Around Charleston</div>
      <div className="flex flex-wrap gap-1.5">
        {LOCAL.map((l) => (
          <button key={l.value} type="button" onClick={() => onPick(l.value)} title={l.place}
            className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${active === l.value ? 'bg-ob text-white' : dark ? 'bg-white/10' : 'bg-[#141414]/[0.06]'}`}>/{l.value}</button>
        ))}
      </div>
    </div>
  )
}
