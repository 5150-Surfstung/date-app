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
/** Sends Val's email. Returns how many digits the code has (6 or 8). */
export async function sendLoginLink(email: string, next = '/inbox/', website = ''): Promise<number> {
  const c = authClient()
  if (!c) throw new Error('Not configured')
  const { data, error: fnError } = await c.functions.invoke('login', { body: { email, next, website } })
  if (!fnError && data?.sent) return Number(data.digits) || 6
  // A refusal (429/503/400) arrives as an error; read the reason from the response.
  let reply = data as { error?: string } | null
  const ctx = (fnError as { context?: Response } | null)?.context
  if (ctx && typeof ctx.json === 'function') { try { reply = await ctx.json() } catch {} }
  const err = reply?.error
  if (err === 'slow') throw new Error('That’s a lot of codes. Check your email, or try again in a few minutes.')
  if (err === 'busy') throw new Error('Val’s swamped this hour. Try again in a few minutes.')
  if (err === 'email') throw new Error('That email doesn’t look right.')
  // Only if Val's function couldn't be reached at all: Supabase's own mailer.
  if (ctx && ctx.status && ctx.status !== 404 && ctx.status < 500) throw new Error('Something went wrong. Try again.')
  const redirect = typeof window !== 'undefined' ? `${window.location.origin}${next}` : undefined
  const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, shouldCreateUser: true } })
  if (error) throw new Error(error.message)
  return 8
}

// The 6-digit code from Val's email. Works in the installed app, where the
// link would open the browser instead.
export async function verifyCode(email: string, code: string) {
  const c = authClient()
  if (!c) throw new Error('Not configured')
  let { error } = await c.auth.verifyOtp({ email, token: code, type: 'email' })
  if (error) ({ error } = await c.auth.verifyOtp({ email, token: code, type: 'magiclink' }))
  if (error) throw new Error('That code didn’t work. Check it, or send a fresh one.')
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
