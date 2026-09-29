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

// Val mails the link herself (the `login` function), pointing straight at
// /login/?th=…; Supabase's own mailer is only the fallback.
export async function sendLoginLink(email: string, next = '/inbox/') {
  const c = authClient()
  if (!c) throw new Error('Not configured')
  const { data, error: fnError } = await c.functions.invoke('login', { body: { email, next } })
  if (!fnError && data?.sent) return
  if ((data as { error?: string } | null)?.error === 'slow') throw new Error('Three links in ten minutes. Check your email, or try again shortly.')
  const redirect = typeof window !== 'undefined' ? `${window.location.origin}${next}` : undefined
  const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, shouldCreateUser: true } })
  if (error) throw new Error(error.message)
}

// The link from Val's email lands here with a one-time token.
export async function redeemLoginToken(tokenHash: string) {
  const c = authClient()
  if (!c) throw new Error('Not configured')
  const { error } = await c.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
  if (error) throw new Error('That link is used or expired. Send a fresh one.')
}

export async function signOut() {
  await authClient()?.auth.signOut()
}
