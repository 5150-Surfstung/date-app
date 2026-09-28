// End-to-end test of the browser→Supabase path, run from a network that can
// reach supabase.co (GitHub Actions). Exercises exactly what the intake flow
// does with the anon key, and proves the RLS write-only model holds over HTTP.
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Missing Supabase env')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })
const runId = process.env.GITHUB_RUN_ID || String(Math.floor(Math.random() * 1e9))
const id = crypto.randomUUID()
let failed = false

function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failed = true
}

// 1. Storage upload with anon key (what the photo/voice upload does)
const upload = await supabase.storage
  .from('date-intake')
  .upload(`${id}/e2e-test.txt`, new Blob([`e2e run ${runId}`]), { contentType: 'text/plain' })
check('storage upload (anon)', !upload.error, upload.error?.message)

// 2. Application insert with anon key (what submit does)
const insert = await supabase.from('date_applications').insert({
  id,
  name: 'E2E Test',
  age: 30,
  email: `e2e-${runId}-${id.slice(0, 8)}@test.invalid`,
  identity: 'Woman',
  seeking: 'Men',
  answers: { e2e: true },
  photo_keys: [`${id}/e2e-test.txt`],
  photo_count: 1,
  status: 'pending_review',
})
check('application insert (anon)', !insert.error, insert.error?.message)

// 3. Anon must NOT read applications back
const read = await supabase.from('date_applications').select('id').limit(1)
check('applications unreadable (anon)', !read.error && read.data.length === 0,
  read.error ? read.error.message : `${read.data?.length} rows visible`)

// 4. Anon must NOT list intake media (outside the brief post-upload window)
await new Promise((r) => setTimeout(r, 11000))
const list = await supabase.storage.from('date-intake').list(id)
const listBlocked = Boolean(list.error) || (list.data ?? []).length === 0
check('intake media unlistable (anon)', listBlocked, `${list.data?.length ?? 0} objects visible`)

// 5. Anon must NOT download intake media
const dl = await supabase.storage.from('date-intake').download(`${id}/e2e-test.txt`)
check('intake media undownloadable (anon)', Boolean(dl.error))


// 6. /spot signal insert (check-in) with anon key
const sig = await supabase.from('date_signals').insert({
  kind: 'checkin', venue_slug: 'golden-hour', email: `e2e-${runId}@test.invalid`,
})
check('spot signal insert (anon)', !sig.error, sig.error?.message)
const sigRead = await supabase.from('date_signals').select('id').limit(1)
check('signals unreadable (anon)', !sigRead.error && sigRead.data.length === 0)


// 7. /name: wall lookup, claim, /hey — all through the RPCs
const wall = await supabase.rpc('handle_wall', { p_handle: 'maya' })
check('wall lookup (demo /maya open, tagged)', !wall.error && wall.data?.open === true && wall.data?.tag === 'looking', wall.error?.message)
const wallPriv = await supabase.rpc('handle_wall', { p_handle: 'marcus' })
check('wall hides private (/marcus)', wallPriv.data?.taken === true && wallPriv.data?.open === false && !wallPriv.data?.name)
const h = `e2e${runId}`.slice(0, 20)
const h2 = `e2eb${runId}`.slice(0, 20)
const claim = await supabase.rpc('claim_handle', { p_handle: h, p_email: `e2e-${runId}@test.invalid`, p_name: 'E2E', p_tag: 'curious', p_private: false })
check('claim handle', !claim.error && claim.data === 'ok', claim.error?.message ?? claim.data)
const claim2 = await supabase.rpc('claim_handle', { p_handle: h2, p_email: `e2e-${runId}-b@test.invalid`, p_name: 'E2E B', p_tag: 'open', p_private: false })
check('claim second handle', !claim2.error && claim2.data === 'ok', claim2.error?.message ?? claim2.data)
const hey = await supabase.rpc('send_hey', { p_to: h2, p_from_email: `e2e-${runId}@test.invalid`, p_note: 'e2e' })
check('send /hey', !hey.error && hey.data === 'ok', hey.error?.message ?? hey.data)
const dupe = await supabase.rpc('send_hey', { p_to: h2, p_from_email: `e2e-${runId}@test.invalid`, p_note: 'again' })
check('one /hey per person', dupe.data === 'dupe', dupe.data)
const wing = await supabase.rpc('send_wing', { p_from_email: `e2e-${runId}@test.invalid`, p_subject: 'maya', p_to: h2, p_note: 'e2e' })
check('send /wing', !wing.error && wing.data === 'ok', wing.error?.message ?? wing.data)
const rep = await supabase.rpc('report_handle', { p_handle: h, p_reason: 'e2e', p_details: null, p_reporter_email: `e2e-${runId}-b@test.invalid`, p_chat: null })
check('report a /name (anon)', !rep.error && rep.data === true, rep.error?.message)
const closed = await supabase.rpc('send_hey', { p_to: 'marcus', p_from_email: `e2e-${runId}@test.invalid`, p_note: null })
check('cannot /hey private', closed.data === 'closed', closed.data)
const handlesRead = await supabase.from('date_handles').select('email').limit(1)
check('handles unreadable (anon)', Boolean(handlesRead.error) || handlesRead.data.length === 0)
const heysRead = await supabase.from('date_heys').select('id').limit(1)
check('heys unreadable (anon)', Boolean(heysRead.error) || heysRead.data.length === 0)
// Tidy up: everything this run created.
const clean = await supabase.rpc('cleanup_e2e')
check('cleanup', !clean.error, clean.error?.message)
process.exit(failed ? 1 : 0)
