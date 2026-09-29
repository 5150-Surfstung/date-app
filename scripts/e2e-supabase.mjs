// End-to-end test of the browser→Supabase path, run from GitHub Actions.
// Proves: anon can't write or read anything private; a signed-in member can
// act only as themselves; the whole /hey → yes → /chat → report → edit →
// export → delete path works. Uses two throwaway accounts on test.invalid
// and removes everything it made.
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) { console.error('Missing Supabase env'); process.exit(1) }

const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const anon = client()
const runId = (process.env.GITHUB_RUN_ID || String(Math.floor(Math.random() * 1e9))).slice(-10)
const pw = `e2e-${runId}-${crypto.randomUUID()}`
let failed = false
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failed = true
}

// ── Anon can't do anything private ─────────────────────────────────────
const fakeId = crypto.randomUUID()
const up = await anon.storage.from('date-intake').upload(`${fakeId}/x.txt`, new Blob(['x']), { contentType: 'text/plain' })
check('anon cannot upload media', Boolean(up.error))
const ins = await anon.from('date_applications').insert({ id: fakeId, name: 'X', age: 30, email: 'x@test.invalid', identity: 'Woman', seeking: 'Men' })
check('anon cannot submit a /vibe', Boolean(ins.error))
const sig = await anon.from('date_signals').insert({ kind: 'checkin', venue_slug: 'golden-hour', email: 'x@test.invalid' })
check('anon cannot write signals', Boolean(sig.error))
const anonHey = await anon.rpc('send_hey', { p_to: 'maya', p_note: 'x' })
check('anon cannot send /hey', Boolean(anonHey.error) || anonHey.data === 'login')
const anonClaim = await anon.rpc('claim_handle', { p_handle: 'e2ezz', p_name: 'X', p_tag: null, p_private: false, p_terms: true })
check('anon cannot claim', Boolean(anonClaim.error) || anonClaim.data === 'login')
for (const t of ['date_applications', 'date_signals', 'date_handles', 'date_heys', 'date_push_subs']) {
  const r = await anon.from(t).select('*').limit(1)
  check(`${t} unreadable (anon)`, Boolean(r.error) || r.data.length === 0)
}
const wall = await retry(() => anon.rpc('handle_wall', { p_handle: 'maya' }), (r) => !r.error)
check('wall lookup (demo /maya)', wall.data?.open === true && wall.data?.tag === 'looking', wall.error?.message)
const wallPriv = await anon.rpc('handle_wall', { p_handle: 'marcus' })
check('wall hides private (/marcus)', wallPriv.data?.taken === true && wallPriv.data?.open === false && !wallPriv.data?.name)
const rec = await anon.rpc('date_receipts')
check('receipts are public', !rec.error && typeof rec.data?.pool === 'number')

// ── Two members ────────────────────────────────────────────────────────
// Supabase's edge can hiccup (502) for a second; don't let that fail a run.
async function retry(fn, ok) {
  let r
  for (let i = 0; i < 4; i++) {
    r = await fn()
    if (ok(r)) return r
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)))
  }
  return r
}
async function member(tag) {
  const email = `e2e-${runId}-${tag}@test.invalid`
  const made = await retry(() => anon.rpc('e2e_user', { p_email: email, p_password: pw }), (r) => r.data === 'ok' || r.data === 'exists')
  const c = client()
  const s = await retry(() => c.auth.signInWithPassword({ email, password: pw }), (r) => !r.error)
  check(`sign in ${tag}`, (made.data === 'ok' || made.data === 'exists') && !s.error, s.error?.message ?? made.data)
  return { c, email, uid: s.data?.user?.id }
}
const A = await member('a')
const B = await member('b')
const hA = `e2e${runId}`.slice(0, 20)
const hB = `e2eb${runId}`.slice(0, 20)

// Media: own folder only
const own = await A.c.storage.from('date-intake').upload(`${A.uid}/photo-0.txt`, new Blob(['a']), { contentType: 'text/plain' })
check('upload to own folder', !own.error, own.error?.message)
const other = await A.c.storage.from('date-intake').upload(`${B.uid}/photo-0.txt`, new Blob(['a']), { contentType: 'text/plain' })
check('cannot upload into someone else’s folder', Boolean(other.error))

// /vibe: only as yourself
const spoof = await A.c.from('date_applications').insert({ id: A.uid, name: 'A', age: 30, email: B.email, identity: 'Woman', seeking: 'Men' })
check('cannot submit a /vibe as someone else', Boolean(spoof.error))
const vibe = await A.c.from('date_applications').insert({ id: A.uid, name: 'A', age: 30, email: A.email, identity: 'Woman', seeking: 'Men',
  answers: { e2e: 'yes' }, photo_keys: [`${A.uid}/photo-0.txt`], photo_count: 1 })
check('submit own /vibe', !vibe.error, vibe.error?.message)
const cheat = await A.c.from('date_applications').insert({ id: crypto.randomUUID(), name: 'A', age: 30, email: A.email, identity: 'Woman', seeking: 'Men', verified: true })
check('cannot self-verify', Boolean(cheat.error))

// Claim
const noTerms = await A.c.rpc('claim_handle', { p_handle: hA, p_name: 'A', p_tag: 'curious', p_private: false, p_terms: false })
check('claim needs terms', noTerms.data === 'terms', noTerms.data)
const cA = await A.c.rpc('claim_handle', { p_handle: hA, p_name: 'A', p_tag: 'curious', p_private: false, p_terms: true })
check('claim /name', cA.data === 'ok', cA.error?.message ?? cA.data)
const cB = await B.c.rpc('claim_handle', { p_handle: hB, p_name: 'B', p_tag: 'open', p_private: false, p_terms: true })
check('claim second /name', cB.data === 'ok', cB.error?.message ?? cB.data)
const twice = await A.c.rpc('claim_handle', { p_handle: `${hA}x`.slice(0, 20), p_name: 'A', p_tag: null, p_private: false, p_terms: true })
check('one /name per person', twice.data === 'email_taken', twice.data)

// Tags change only your own /name
await A.c.rpc('set_tag', { p_tag: 'slow', p_private: false })
const wA = await anon.rpc('handle_wall', { p_handle: hA })
const wB = await anon.rpc('handle_wall', { p_handle: hB })
check('set_tag changes only mine', wA.data?.tag === 'slow' && wB.data?.tag === 'open', `${wA.data?.tag}/${wB.data?.tag}`)

// Up to three /tags, lead first
const three = await A.c.rpc('set_tags', { p_tags: ['slow', 'looking', 'fun'], p_private: false })
const four = await A.c.rpc('set_tags', { p_tags: ['slow', 'looking', 'fun', 'open'], p_private: false })
const junk = await A.c.rpc('set_tags', { p_tags: ['wild'], p_private: false })
const w3 = await anon.rpc('handle_wall', { p_handle: hA })
check('three /tags, lead first', three.data === 'ok' && w3.data?.tag === 'slow' && w3.data?.tags?.join() === 'slow,looking,fun', JSON.stringify(w3.data?.tags))
check('four /tags refused', four.data === 'bad', four.data)
check('made-up /tag refused', junk.data === 'bad', junk.data)

// /hey and /wing as yourself
const hey = await A.c.rpc('send_hey', { p_to: hB, p_note: 'e2e' })
check('send /hey', hey.data === 'ok', hey.error?.message ?? hey.data)
const dupe = await A.c.rpc('send_hey', { p_to: hB, p_note: 'again' })
check('one /hey per person', dupe.data === 'dupe', dupe.data)
const closed = await A.c.rpc('send_hey', { p_to: 'marcus', p_note: null })
check('cannot /hey private', closed.data === 'closed', closed.data)
const wing = await A.c.rpc('send_wing', { p_subject: 'maya', p_to: hB, p_note: 'e2e' })
check('send /wing', wing.data === 'ok', wing.error?.message ?? wing.data)
const spotIn = await A.c.rpc('date_signal', { p_kind: 'checkin', p_venue: 'golden-hour', p_note: null })
check('scan in at a /spot', spotIn.data === 'ok', spotIn.error?.message ?? spotIn.data)

// B's side: inbox, yes, /chat
const inbox = await B.c.rpc('my_inbox')
const theHey = (inbox.data ?? []).find((x) => x.kind === 'hey' && x.from?.handle === hA)
check('inbox shows the /hey', Boolean(theHey), inbox.error?.message)
const yes = theHey ? await B.c.rpc('answer_hey', { p_hey: theHey.id, p_yes: true }) : { data: null }
check('yes opens a /chat', typeof yes.data === 'string', yes.error?.message)
const chatsA = await A.c.rpc('my_chats')
check('both see the /chat', (chatsA.data ?? []).some((c) => c.id === yes.data))
const msg = await A.c.from('date_messages').insert({ chat_id: yes.data, from_email: A.email, body: 'hi' })
check('send a message', !msg.error, msg.error?.message)
const fake = await A.c.from('date_messages').insert({ chat_id: yes.data, from_email: B.email, body: 'spoof' })
check('cannot message as the other person', Boolean(fake.error))

// Home, edit, prefs, export
const home = await A.c.rpc('my_home')
check('home: where you stand', home.data?.handle?.handle === hA && home.data?.vibe?.status === 'pending_review' && home.data?.open_chats === 1, JSON.stringify(home.data?.open_chats))
const edit = await A.c.rpc('update_my_vibe', { p_neighborhood: 'Downtown', p_identity: null, p_seeking: 'Everyone', p_answers: { e2e: 'edited' }, p_photo_keys: [`${A.uid}/photo-0.txt`], p_voice_key: null })
check('edit /vibe', edit.data === 'ok', edit.error?.message ?? edit.data)
const badEdit = await A.c.rpc('update_my_vibe', { p_neighborhood: null, p_identity: null, p_seeking: null, p_answers: null, p_photo_keys: [`${B.uid}/x.jpg`], p_voice_key: null })
check('cannot point /vibe at someone else’s photos', badEdit.data === 'bad', badEdit.data)
const prefs = await A.c.rpc('set_email_prefs', { p_prefs: { heys: false, chats: true, dates: true } })
check('email preferences', prefs.data === true)
const data = await A.c.rpc('my_data')
check('download my data', data.data?.account?.handle === hA && data.data?.heys_sent?.length === 1 && !('unsub_token' in (data.data?.account ?? {})))

// Report → block → unblock
const rep = await B.c.rpc('report_handle', { p_handle: hA, p_reason: 'e2e', p_details: null, p_reporter_email: null, p_chat: yes.data })
check('report a /name', rep.data === true, rep.error?.message)
const blocks = await B.c.rpc('my_blocks')
check('report blocks them', (blocks.data ?? []).some((b) => b.handle === hA))
const ub = await B.c.rpc('unblock', { p_handle: hA })
check('unblock', ub.data === true)

// Safety v2: a serious report from someone with contact removes them at once.
const serious = await B.c.rpc('report_handle', { p_handle: hA, p_reason: 'Harassing or pressuring', p_details: 'e2e', p_reporter_email: null, p_chat: null })
const gone1 = await anon.rpc('handle_wall', { p_handle: hA })
check('serious report after contact removes them', serious.data === true && gone1.data?.open === false, JSON.stringify(gone1.data))
const homeA = await A.c.rpc('my_home')
check('they see they are paused', homeA.data?.handle?.suspended === true)
const stuck = await A.c.rpc('send_hey', { p_to: 'maya', p_note: null })
check('removed members can\u2019t send /heys', stuck.data === 'closed' || stuck.data === 'dupe', stuck.data)
const blk = await B.c.rpc('block_handle', { p_handle: hA })
check('block without reporting', blk.data === true)

// Leave
const files = await A.c.storage.from('date-intake').list(A.uid)
if (files.data?.length) await A.c.storage.from('date-intake').remove(files.data.map((f) => `${A.uid}/${f.name}`))
const noConfirm = await A.c.rpc('delete_me', { p_confirm: 'nope' })
check('delete needs confirmation', noConfirm.data === 'confirm', noConfirm.data)
const del = await A.c.rpc('delete_me', { p_confirm: 'DELETE' })
check('delete my account', del.data === 'ok', del.error?.message ?? del.data)
const gone = await anon.rpc('handle_wall', { p_handle: hA })
check('deleted /name is gone', gone.data?.taken === false)
const chatsB = await B.c.rpc('my_chats')
check('their /chat went with them', !(chatsB.data ?? []).some((c) => c.id === yes.data))

const clean = await anon.rpc('cleanup_e2e')
check('cleanup', !clean.error, clean.error?.message)
process.exit(failed ? 1 : 0)
