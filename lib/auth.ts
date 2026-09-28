'use client'

import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

// Browser client that keeps you signed in. Separate from lib/supabase.ts,
// which is the stateless anon client for public pages.
let client: SupabaseClient | null = null
export function authClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  if (!client) client = createClient(url, key, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } })
  return client
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const c = authClient()
    if (!c) { setLoading(false); return }
    c.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = c.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  return { session, loading, email: session?.user.email?.toLowerCase() ?? null }
}

export async function sendLoginLink(email: string) {
  const c = authClient()
  if (!c) throw new Error('Not configured')
  const redirect = typeof window !== 'undefined' ? `${window.location.origin}/inbox/` : undefined
  const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, shouldCreateUser: true } })
  if (error) throw new Error(error.message)
}

export async function signOut() {
  await authClient()?.auth.signOut()
}
