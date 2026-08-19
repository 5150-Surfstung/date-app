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

process.exit(failed ? 1 : 0)
