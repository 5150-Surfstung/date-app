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

// Nothing happens with other members until Val's people approve you
const tooSoon = await A.c.rpc('send_hey', { p_to: hB, p_note: 'too soon' })
check('unapproved members cannot send /heys', tooSoon.data === 'not_approved', tooSoon.data)
const earlyVibe = await A.c.rpc('send_vibe', { p_to: hB, p_vibe: 'tacos', p_note: null })
check('unapproved members cannot send vibes', earlyVibe.data === 'not_approved', earlyVibe.data)
const earlyWing = await A.c.rpc('send_wing', { p_subject: hB, p_to: 'x@test.invalid', p_note: null })
check('unapproved members cannot /wing', earlyWing.data === 'not_approved', earlyWing.data)
const wallEarly = await anon.rpc('handle_wall', { p_handle: hB })
check('unapproved /name pages stay closed', wallEarly.data?.open === false && wallEarly.data?.pending === true, JSON.stringify(wallEarly.data))
const apReal = await anon.rpc('e2e_approve', { p_email: 'someone@gmail.com' })
check('the test-approval helper refuses real emails', apReal.data === 'no', apReal.data)
const apA = await anon.rpc('e2e_approve', { p_email: A.email })
const apB = await anon.rpc('e2e_approve', { p_email: B.email })
check('approve the two test members', apA.data === 'ok' && apB.data === 'ok', `${apA.data}/${apB.data}`)

// Tags change only your own /name
await A.c.rpc('set_tag', { p_tag: 'slow', p_private: false })
const wA = await anon.rpc('handle_wall', { p_handle: hA })
const wB = await anon.rpc('handle_wall', { p_handle: hB })
check('set_tag changes only mine', wA.data?.tag === 'slow' && wB.data?.tag === 'open', `${wA.data?.tag}/${wB.data?.tag}`)

// Up to three /tags, lead first
const three = await A.c.rpc('set_tags', { p_tags: ['slow', 'looking', 'fun'], p_private: false })
const four = await A.c.rpc('set_tags', { p_tags: ['slow', 'looking', 'fun', 'open'], p_private: false })
const junk = await A.c.rpc('set_tags', { p_tags: ['cashapp'], p_private: false })
const w3 = await anon.rpc('handle_wall', { p_handle: hA })
check('three vibes, lead first', three.data === 'ok' && w3.data?.tag === 'slow' && w3.data?.tags?.join() === 'slow,looking,fun', JSON.stringify(w3.data?.tags))
check('four vibes refused', four.data === 'bad', four.data)
check('blocked vibe refused (selling, slurs, minors, numbers)', junk.data === 'bad', junk.data)

// Vibes are yours: make one up, switch the lead in one tap, nothing expires
const ownVibe = await A.c.rpc('set_vibe_now', { p_vibe: '/Tacos' })
const wOwn = await anon.rpc('handle_wall', { p_handle: hA })
check('make your own vibe, it leads', ownVibe.data === 'ok' && wOwn.data?.tags?.join() === 'tacos,slow,looking', JSON.stringify(wOwn.data?.tags))
const tonight = await A.c.rpc('set_vibe_now', { p_vibe: 'tonight' })
const wT = await anon.rpc('handle_wall', { p_handle: hA })
check('/tonight is just a vibe (no midnight clock)', tonight.data === 'ok' && wT.data?.tag === 'tonight' && wT.data?.visibility !== 'tonight', JSON.stringify(wT.data))

// Send a vibe instead of a /hey
const vibeSend = await B.c.rpc('send_vibe', { p_to: hA, p_vibe: 'tacos', p_note: null })
check('send a vibe', vibeSend.data === 'ok', vibeSend.error?.message ?? vibeSend.data)
const badSend = await B.c.rpc('send_vibe', { p_to: hA, p_vibe: 'venmome', p_note: null })
check('blocked vibe cannot be sent', badSend.data === 'bad_vibe', badSend.data)
const inboxA = await A.c.rpc('my_inbox')
check('inbox shows the vibe', (inboxA.data ?? []).some((i) => i.vibe === 'tacos' && i.from?.handle === hB))

// The pool: only people who'd want you back (A: woman seeking men; B: man seeking women)
const poolAnon = await anon.rpc('my_pool')
const poolA = await A.c.rpc('my_pool')
check('pool needs a login', poolAnon.data?.state === 'login' || !!poolAnon.error, JSON.stringify(poolAnon.data))
check('approved members see their pool, both ways', poolA.data?.state === 'open' && (poolA.data?.people ?? []).some((p) => p.handle === hB), JSON.stringify(poolA.data?.people?.map((p) => p.handle)))
const picks = await A.c.rpc('save_my_picks', { p: [{ handle: 'maya', reason: 'x' }, { handle: hB, reason: 'Same kind of Saturday.' }] })
const afterPick = await A.c.rpc('my_pool')
check('Val only picks from your own pool', picks.data === 'ok' && (afterPick.data?.picks ?? []).map((p) => p.handle).join() === hB, JSON.stringify(afterPick.data?.picks))
const peekAnon = await anon.storage.from('date-intake').createSignedUrl(`${A.uid}/photo-0.txt`, 60)
check('photos stay private outside the pool', !!peekAnon.error || !peekAnon.data?.signedUrl)
const peekPool = await B.c.storage.from('date-intake').createSignedUrl(`${A.uid}/photo-0.txt`, 60)
check('people in your pool see the photos you share', !peekPool.error && !!peekPool.data?.signedUrl, peekPool.error?.message)
await A.c.rpc('set_photo_share', { p: 'none' })
const peekNone = await B.c.storage.from('date-intake').createSignedUrl(`${A.uid}/photo-0.txt`, 60)
check('"none until we\u2019re talking" hides them', !!peekNone.error || !peekNone.data?.signedUrl)
const share = await A.c.rpc('set_photo_share', { p: 'main' })
const shareBad = await A.c.rpc('set_photo_share', { p: 'everyone' })
check('photo sharing is your choice', share.data === 'ok' && shareBad.data === 'bad', `${share.data}/${shareBad.data}`)

// Live map + trending: public, counts only
const map = await anon.rpc('vibe_map')
check('the live vibe map is public and counts only', !map.error && Array.isArray(map.data?.spots) && !JSON.stringify(map.data).includes('@'), map.error?.message)
const trend = await anon.rpc('trending_vibes')
check('trending slashes are public', !trend.error && Array.isArray(trend.data?.top), trend.error?.message)
const sneakSponsor = await B.c.rpc('val_save_sponsor', { p_vibe: 'free', p_label: null, p_spot: null, p_starts: null, p_ends: new Date(Date.now() + 864e5).toISOString() })
check('members cannot sell sponsored vibes', sneakSponsor.data === 'admin' || !!sneakSponsor.error, sneakSponsor.data)
const sneakDrop = await anon.rpc('date_run_drop')
check('nobody outside can trigger the Friday drop', !!sneakDrop.error)

// Voice /hey: only a file from your own folder
const badVoice = await B.c.rpc('send_hey_voice', { p_to: hA, p_voice: `${A.uid}/hey-1.webm`, p_note: null, p_vibe: null })
check('voice /heys must be your own recording', badVoice.data === 'bad_voice', badVoice.data)

// /hey and /wing as yourself
const hey = await A.c.rpc('send_hey', { p_to: hB, p_note: 'e2e' })
check('send /hey', hey.data === 'ok', hey.error?.message ?? hey.data)
const dupe = await A.c.rpc('send_hey', { p_to: hB, p_note: 'again' })
check('one /hey per person', dupe.data === 'dupe', dupe.data)
const closed = await A.c.rpc('send_hey', { p_to: 'marcus', p_note: null })
check('cannot /hey private (or demo)', closed.data === 'closed' || closed.data === 'demo', closed.data)
const toDemo = await A.c.rpc('send_hey', { p_to: 'maya', p_note: 'hi' })
check('demo profiles can\u2019t receive a /hey', toDemo.data === 'demo', toDemo.data)
const wingDemo = await A.c.rpc('send_wing', { p_subject: 'maya', p_to: hB, p_note: 'e2e' })
check('demo profiles can\u2019t be /winged', wingDemo.data === 'demo', wingDemo.data)
const wing = await B.c.rpc('send_wing', { p_subject: hA, p_to: `e2e-${runId}-friend@test.invalid`, p_note: 'e2e' })
check('send /wing', wing.data === 'invited', wing.error?.message ?? wing.data)
// Check-ins only work at live /spots, and only with proof you're there:
// your location, or the key in the spot's window QR. The old blind check-in is gone.
const pausedIn = await A.c.rpc('check_in', { p_spot: 'golden-hour', p_lat: 32.7765, p_lng: -79.9311, p_acc: 10 })
check('paused /spots refuse check-ins', pausedIn.data === 'bad', pausedIn.data)
const blindIn = await A.c.rpc('date_signal', { p_kind: 'checkin', p_venue: 'golden-hour', p_note: null })
check('no check-in without proof', blindIn.data === 'use_check_in', blindIn.data)

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

// Swap numbers: both tap or nobody sees anything.
const early = await A.c.rpc('offer_swap', { p_chat: yes.data, p_phone: '8435550100', p_instagram: null })
check('no swap before a date is set', early.data === 'not_yet', early.data)
await A.c.rpc('set_date', { p_chat: yes.data, p_spot: 'golden-hour', p_at: new Date(Date.now() + 86400000).toISOString() })
const badPhone = await A.c.rpc('offer_swap', { p_chat: yes.data, p_phone: '12', p_instagram: null })
check('bad phone refused', badPhone.data === 'bad_phone', badPhone.data)
const offerA = await A.c.rpc('offer_swap', { p_chat: yes.data, p_phone: '(843) 555-0100', p_instagram: null })
const peek = await B.c.rpc('my_swap', { p_chat: yes.data })
check('one side offering stays invisible', offerA.data === 'waiting' && peek.data?.theirs === null && peek.data?.swapped === false, JSON.stringify(peek.data))
const offerB = await B.c.rpc('offer_swap', { p_chat: yes.data, p_phone: null, p_instagram: '@e2e.b' })
const seenA = await A.c.rpc('my_swap', { p_chat: yes.data })
const seenB = await B.c.rpc('my_swap', { p_chat: yes.data })
check('both tap → both see', offerB.data === 'swapped' && seenA.data?.theirs?.instagram === 'e2e.b' && seenB.data?.theirs?.phone === '8435550100', JSON.stringify([seenA.data?.theirs, seenB.data?.theirs]))

// "We found each other": both must tap; story only if both share; either can undo
const foundA = await A.c.rpc('found_each_other', { p_chat: yes.data })
check('one tap is only a question', foundA.data?.state === 'waiting', JSON.stringify(foundA.data))
const foundB = await B.c.rpc('found_each_other', { p_chat: yes.data })
check('both tap: off the market', foundB.data?.state === 'together', JSON.stringify(foundB.data))
const wallTaken = await anon.rpc('handle_wall', { p_handle: hA })
check('their /name says found, not open', wallTaken.data?.open === false && wallTaken.data?.found === true, JSON.stringify(wallTaken.data))
const couple = foundB.data?.id
await A.c.rpc('share_our_story', { p_couple: couple, p_yes: true })
const wallOne = await anon.rpc('couples_wall')
check('a story needs both yeses', !(wallOne.data?.stories ?? []).some((x) => x.a === hA || x.b === hA))
const stranger = await anon.rpc('share_our_story', { p_couple: couple, p_yes: true })
check('strangers cannot share a story', stranger.data !== 'ok' || !!stranger.error)
const backA = await A.c.rpc('back_on_the_market')
const backB = await B.c.rpc('back_on_the_market')
check('back on the market works', backA.data === 'ok' && backB.data === 'ok')

// /missed: only people who were there, around the same time; anonymous until both say yes
const mSpot = { name: `E2E Missed ${runId}`, kind: 'bar', contact_name: 'Tess', contact_email: `e2e-${runId}-missed@test.invalid`, standards_ok: true, instagram: 'https://www.instagram.com/e2e.spot/?hl=en', hours: 'Daily 4pm–2am', about: 'Oysters and a patio' }
await anon.rpc('date_spot_apply', { p: mSpot })
const mSlug = `e2e-missed-${runId}`
const mApproved = await anon.rpc('e2e_approve_spot', { p_slug: mSlug })
check('test spot approved (test helper only)', mApproved.data === 'ok', mApproved.data)
const card = await anon.rpc('public_spot', { p_slug: mSlug })
check('spot card: socials cleaned, hours and about', card.data?.instagram === 'e2e.spot' && card.data?.hours === 'Daily 4pm–2am' && card.data?.about === 'Oysters and a patio', JSON.stringify(card.data))
const door = (await anon.rpc('e2e_spot_door', { p_slug: mSlug })).data
check('test spot pinned (test helper only)', !!door?.key, JSON.stringify(door))
const kitNoKey = await anon.rpc('spot_door', { p_slug: mSlug, p_key: 'nope' })
check('window QR page needs the key', kitNoKey.data === null, JSON.stringify(kitNoKey.data))
const kitKey = await anon.rpc('spot_door', { p_slug: mSlug, p_key: door?.key })
check('window QR page with the key', kitKey.data?.key === door?.key)
const feedAway = await A.c.rpc('missed_feed', { p_spot: mSlug })
check('no feed unless you checked in', feedAway.data?.state === 'not_here', JSON.stringify(feedAway.data))
const postAway = await A.c.rpc('post_missed', { p_spot: mSlug, p_you: 'Green jacket', p_me: null })
check('cannot post unless you were there', postAway.data === 'not_here', postAway.data)
const noProof = await A.c.rpc('check_in', { p_spot: mSlug })
check('check-in needs location or the window QR', noProof.data === 'where', noProof.data)
const fuzzyIn = await A.c.rpc('check_in', { p_spot: mSlug, p_lat: door?.lat, p_lng: door?.lng, p_acc: 900 })
check('fuzzy location refused', fuzzyIn.data === 'fuzzy', fuzzyIn.data)
const farIn = await A.c.rpc('check_in', { p_spot: mSlug, p_lat: door?.lat + 0.01, p_lng: door?.lng, p_acc: 10 })
check('a block away is too far', farIn.data === 'far', farIn.data)
const badKey = await A.c.rpc('check_in', { p_spot: mSlug, p_key: 'guess' })
check('a guessed QR key does nothing', badKey.data === 'where', badKey.data)
const hereIn = await A.c.rpc('check_in', { p_spot: mSlug, p_lat: door?.lat + 0.0002, p_lng: door?.lng, p_acc: 15 })
check('check in by location', hereIn.data === 'ok', hereIn.data)
const nowA = await A.c.rpc('my_spot_now')
check('the app knows where you are checked in', nowA.data?.slug === mSlug, JSON.stringify(nowA.data))
const rude = await A.c.rpc('post_missed', { p_spot: mSlug, p_you: 'nice legs by the bar', p_me: null })
check('no body talk', rude.data === 'words', rude.data)
const posted = await A.c.rpc('post_missed', { p_spot: mSlug, p_you: 'Green jacket, laughed at the bartender joke', p_me: 'Blue hat' })
check('post a missed connection', posted.data === 'ok', posted.data)
const againMissed = await A.c.rpc('post_missed', { p_spot: mSlug, p_you: 'Someone else entirely', p_me: null })
check('one a night', againMissed.data === 'one_a_night', againMissed.data)
const feedBAway = await B.c.rpc('missed_feed', { p_spot: mSlug })
check('others who were not there see nothing', feedBAway.data?.state === 'not_here')
const doorIn = await B.c.rpc('check_in', { p_spot: mSlug, p_key: door?.key })
check('check in by the window QR', doorIn.data === 'ok', doorIn.data)
const feedB = await B.c.rpc('missed_feed', { p_spot: mSlug })
const thePost = (feedB.data?.posts ?? [])[0]
check('people who were there see it, with no name', !!thePost && !JSON.stringify(feedB.data).includes(hA) && !JSON.stringify(feedB.data).includes('@'), JSON.stringify(feedB.data))
const claimed = await B.c.rpc('claim_missed', { p_id: thePost?.id })
check('"that was me"', claimed.data === 'ok', claimed.data)
const claimsA = await A.c.rpc('my_missed_claims')
const theClaim = (claimsA.data ?? [])[0]
check('the poster sees who, with their /vibe card', theClaim?.from?.handle === hB, JSON.stringify(claimsA.data))
const sneakAnswer = await B.c.rpc('answer_missed_claim', { p_claim: theClaim?.claim, p_yes: true })
check('only the poster can answer', sneakAnswer.data === 'not_yours', sneakAnswer.data)
const opened = await A.c.rpc('answer_missed_claim', { p_claim: theClaim?.claim, p_yes: true })
check('both yes opens a /chat', typeof opened.data === 'string' && opened.data.length > 20, opened.data)
await A.c.rpc('check_out', { p_spot: mSlug })
const outA = await A.c.rpc('my_spot_now')
check('"I\u2019m out" checks you out', outA.data === null, JSON.stringify(outA.data))

// Home, edit, prefs, export
const home = await A.c.rpc('my_home')
check('home: where you stand', home.data?.handle?.handle === hA && home.data?.vibe?.status === 'approved' && home.data?.open_chats >= 1, JSON.stringify(home.data?.open_chats))
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

// Launch instruments
const logged = await anon.rpc('date_log_error', { p_message: 'e2e test error', p_stack: null, p_url: '/e2e', p_ua: 'e2e' })
check('phones can log errors', !logged.error, logged.error?.message)
const funnelAnon = await anon.rpc('val_funnel')
const funnelB = await B.c.rpc('val_funnel')
check('funnel and health are Val-only', (funnelAnon.error || funnelAnon.data === null) && funnelB.data === null)

// /spots: anyone can apply, only Val approves, nothing pending is public
const spotEmail = `e2e-${runId}-spot@test.invalid`
const spotApp = { name: `E2E Spot ${runId}`, kind: 'bar', contact_name: 'Tess', contact_email: spotEmail, standards_ok: true }
const applied = await anon.rpc('date_spot_apply', { p: spotApp })
check('a venue can apply', applied.data === 'ok', applied.error?.message ?? applied.data)
const again = await anon.rpc('date_spot_apply', { p: spotApp })
check('one pending application per email', again.data === 'dupe', again.data)
const noStd = await anon.rpc('date_spot_apply', { p: { ...spotApp, contact_email: `e2e-${runId}-spot2@test.invalid`, standards_ok: false } })
check('standards must be agreed', noStd.data === 'standards', noStd.data)
const pendingSpot = await anon.rpc('public_spot', { p_slug: `e2e-spot-${runId}` })
const publicList = await anon.rpc('public_spots')
check('pending spots are not public', pendingSpot.data === null && !(publicList.data ?? []).some((s) => s.slug === `e2e-spot-${runId}`))
const rawVenues = await anon.from('date_venues').select('contact_email').limit(1)
check('venue contact details are private', (rawVenues.data ?? []).length === 0)
const selfApprove = await B.c.rpc('val_review_spot', { p_slug: `e2e-spot-${runId}`, p_action: 'approve', p_note: null })
check('members cannot approve spots', selfApprove.data === 'admin' || !!selfApprove.error, selfApprove.data)
const selfRep = await B.c.rpc('val_save_rep', { p_code: `e2e${runId}`, p_name: 'Sneaky', p_email: null, p_active: true })
check('members cannot add reps', selfRep.data === 'admin' || !!selfRep.error, selfRep.data)

const clean = await anon.rpc('cleanup_e2e')
check('cleanup', !clean.error, clean.error?.message)
process.exit(failed ? 1 : 0)
