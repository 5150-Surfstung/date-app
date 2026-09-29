'use client'

// Val's ideas for where to go, right where they're planning. Built from facts
// (which rooms turn first dates into seconds, where their vibe's crowd goes,
// what's new), never from either person's own check-ins.
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth'

type Idea = { slug: string; name: string; area: string | null; why: string }

export function SpotIdeas({ chatId, picked, onPick }: { chatId: string; picked: string; onPick: (slug: string) => void }) {
  const [ideas, setIdeas] = useState<Idea[]>([])
  useEffect(() => {
    authClient()?.rpc('val_spot_ideas', { p_chat: chatId }).then(({ data }) => setIdeas((data as Idea[]) ?? []))
  }, [chatId])
  if (!ideas.length) return null
  return (
    <div className="grid gap-2">
      <div className="text-xs tracking-[0.15em] uppercase font-semibold text-[#141414]/50">Val&rsquo;s ideas</div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {ideas.map((i) => (
          <button key={i.slug} onClick={() => onPick(i.slug)}
            className={`snap-start shrink-0 w-64 text-left rounded-2xl p-4 border-2 transition ${picked === i.slug ? 'border-ob bg-ob text-white' : 'border-[#141414]/10 bg-white hover:border-ob'}`}>
            <div className="font-display font-extrabold text-lg leading-tight">{i.name}</div>
            {i.area && <div className={`text-xs ${picked === i.slug ? 'text-white/80' : 'text-[#141414]/50'}`}>{i.area}</div>}
            <p className="mt-2 text-sm leading-snug">{i.why}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
