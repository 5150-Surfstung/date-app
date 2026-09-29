'use client'

// Up to three /tags, lead first. One picker for claim and /me, so the rule
// ("three max, the first one leads") reads the same everywhere.
import { useState } from 'react'
import { TAGS, type Tag } from '@/lib/handles'

export const MAX_TAGS = 3

export function TagPicker({ value, onChange, disabled }: { value: Tag[]; onChange: (t: Tag[]) => void; disabled?: boolean }) {
  const [full, setFull] = useState(false)
  function tap(t: Tag) {
    if (value.includes(t)) { onChange(value.filter((x) => x !== t)); setFull(false); return }
    if (value.length >= MAX_TAGS) { setFull(true); return }
    onChange([...value, t]); setFull(false)
  }
  function lead(t: Tag) { onChange([t, ...value.filter((x) => x !== t)]) }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {TAGS.map((t) => {
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
          <p className="mt-1 text-sm text-[#141414]/60">{TAGS.find((t) => t.value === value[0])?.line}</p>
        </div>
      ) : null}

      <p className={`text-sm ${full ? 'font-semibold text-ob' : 'text-[#141414]/55'}`}>
        {full ? 'Three max. Tap one to drop it first.' : value.length === 0 ? 'Up to three. The first one leads.' : value.length < MAX_TAGS ? `${MAX_TAGS - value.length} more if it’s true. The first one leads.` : 'That’s three. The first one leads.'}
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
