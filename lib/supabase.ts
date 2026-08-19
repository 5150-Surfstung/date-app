import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Tables are date_-prefixed because the current Supabase project is shared
// with other apps; a dedicated project drops the prefix later.
export const APPLICATIONS_TABLE = 'date_applications'
export const INTAKE_BUCKET = 'date-intake'

// Browser client on the anon key. RLS makes this write-only: it can submit
// applications and upload intake media, and can never read either back.
let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  if (!client) client = createClient(url, key, { auth: { persistSession: false } })
  return client
}
