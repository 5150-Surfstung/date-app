import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Tables are date_-prefixed because the current Supabase project is shared
// with other apps; a dedicated project drops the prefix later.
export const APPLICATIONS_TABLE = 'date_applications'
export const INTAKE_BUCKET = 'date-intake'

// Server-side client. Prefers the service role key; falls back to the anon
// key, which RLS restricts to insert-only on applications and uploads into
// the intake bucket. Returns null when Supabase isn't configured so the API
// falls back to local-file storage during development.
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
