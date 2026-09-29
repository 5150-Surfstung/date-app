// Anonymous database reads without the Supabase client library: one fetch to
// the RPC endpoint. Public pages use this so they don't ship ~75KB of JS just
// to read a few numbers. Same anon key, same RLS, same functions.
export async function rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<{ data: T | null; error: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { data: null, error: 'Not configured' }
  try {
    const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    })
    const body = r.status === 204 ? null : await r.json()
    return r.ok ? { data: body as T, error: null } : { data: null, error: body?.message ?? `HTTP ${r.status}` }
  } catch (e) {
    return { data: null, error: (e as Error).message }
  }
}
