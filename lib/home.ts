'use client'

// The member's whole picture in one call (my_home). Used by /me, /me/edit
// and /me/settings.
import { useCallback, useEffect, useState } from 'react'
import { authClient, useSession } from './auth'
import type { Tag } from './handles'

export type Home = {
  handle: { handle: string; name: string; tag: Tag | null; visibility: string; founding: number | null;
            email_prefs: { heys: boolean; chats: boolean; dates: boolean }; terms_at: string | null; created_at: string } | null
  vibe: { id: string; status: string; verified: boolean; age: number; neighborhood: string | null; identity: string; seeking: string;
          answers: Record<string, string>; photo_keys: string[]; voice_key: string | null; created_at: string; updated_at: string | null } | null
  waiting: number
  open_chats: number
  intros: { id: string; with: string; status: string; created_at: string; second: boolean }[]
  dates: number
  heys_sent: number
}

export function useHome() {
  const { email, loading } = useSession()
  const [home, setHome] = useState<Home | null | undefined>(undefined)
  const load = useCallback(async () => {
    const { data } = await authClient()!.rpc('my_home')
    setHome((data as Home) ?? null)
  }, [])
  useEffect(() => { if (email) load(); else if (!loading) setHome(null) }, [email, loading, load])
  return { email, loading: loading || (Boolean(email) && home === undefined), home: home ?? null, reload: load }
}

// Private photos, loaded as blob URLs through the member's own-folder policy.
export function usePhotos(keys: string[] | undefined) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!keys?.length) return
    let live = true
    const made: string[] = []
    Promise.all(keys.map(async (k) => {
      const { data } = await authClient()!.storage.from('date-intake').download(k)
      if (!data) return [k, ''] as const
      const u = URL.createObjectURL(data); made.push(u)
      return [k, u] as const
    })).then((pairs) => { if (live) setUrls(Object.fromEntries(pairs.filter(([, u]) => u))) })
    return () => { live = false; made.forEach((u) => URL.revokeObjectURL(u)) }
  }, [keys?.join('|')])
  return urls
}
