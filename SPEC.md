# /date — Product Spec v2

> Your vibe is your profile. Three matches. No games. Real people.

This is the durable spec. Start every new session with: **"Read SPEC.md, then continue where we left off."**
v2 supersedes the original spec. It keeps the romance, adds the trust architecture, and fixes the sequencing — the original was designed for 100,000 users; this is designed to get the first 100 right and let the software calcify around what works.

---

## 1. The hole we fill

Every incumbent dating app gets paid when you fail. Match Group's revenue depends on users staying single and engaged — success equals churn. Nobody has fixed this because fixing it breaks the business model.

**/date is structurally paid to get you off the app.**

The second hole: context and accountability. People want to "meet through friends" because friends provide vetting and consequences for bad behavior. Apps stripped both out. Ghosting is free. Flaking is free. Nobody observes outcomes.

/date restores both: venues and communities provide context; the debrief loop provides accountability.

## 2. Positioning

- AI-native matchmaking, not swiping. The world's best human matchmakers — deep profiling, behavioral analysis, relationship science — at consumer scale.
- Luxury-scarce, against infinite-swipe. Three matches. Narrative before photos. Silence between.
- Privacy and safety as luxury features, marketed loudly.

## 3. The flywheel (venue loop)

The core distribution and revenue loop:

1. **QR codes at partner venues** (coffee shops, yoga/pilates studios, climbing gyms, book clubs, salons — places where women already are and trust the space). Scanning joins you to that venue's local pool. Physical distribution automatically concentrates the pool geographically — this is the liquidity fix.
2. **The venue is a sponsor with a spot in the app.** But it isn't buying an ad — it's buying date traffic: the Date Intelligence Brief sends couples to the sponsoring venue ("your table is held at 7, first round's on them").
3. **The venue is also the safety story**: first dates happen at places we know — public, staffed, familiar.
4. **Success is celebrated at the venue** ("met here, Season I" card on the wall) — the venue's marketing and ours are the same artifact.

Venue rules learned the hard way (by others):
- First 10 venues: founder walks in personally, picks places with existing relationships. Self-serve QR printing kit is the scale mechanism for venues 11–100, not venue 1.
- Passive QR codes convert terribly. Every code needs a *moment*: a co-hosted singles night, a bartender script, a receipt insert ("first Season free for this bar's regulars").
- **Don't charge sponsors until there's proof.** Early venues pay by printing the code and talking it up. Charge when we can say "we sent 40 dates to venues like yours last month."

## 4. Go-to-market

- **One city. One scene.** Launch inside existing communities (run clubs, gyms, churches, alumni networks) — they already have density, gender balance, and trust. "Meeting through friends, at scale."
- **Concierge MVP first.** The founder does the matching by hand with Claude as copilot. The product at launch is: an intake flow, an internal matching console only we see, and a beautiful match-reveal page. Automate only what has been done manually 50 times.
- **Kill condition (test this before anything else):** can we get ~50 women in one city to complete the intake in two weeks? Female-side trust is the binding constraint of every dating product; men follow automatically. If this fails, no algorithm saves it.
- Communities tier targets gyms/clubs/social groups. **Employers are cut** — workplace dating is an HR liability minefield.

## 5. Product mechanics

### Kept from v1
- **Progressive profiling**: fast entry, deeper profile unlocks before first match. 13 questions cut to ~8 for v1 (values, attachment style, conflict approach, life stage, energy).
- **The 60-second unscripted voice note.** The moat feature: un-fakeable, highest-signal artifact, anti-catfish, and "hear them before you see them" is the thesis made physical.
- **Narrative before photos.** Match reveal is a personality narrative; photos unlock when both people are ready.
- **Date Intelligence Brief**: where to go (sponsor venue, table held), what to talk about, what matters to them, what not to do, why this pairing. The screenshot-and-send-to-friends feature — our organic growth loop.
- **7-day match window + intent signals** (Ready / Deciding / Not feeling it). Matches expire gracefully.
- **Season system**: 90-day cohorts. Pool confidence states: <75 = LOW, 75–150 = MEDIUM, 150+ = HIGH — shown to users honestly (see Pool transparency).
- **Three notifications only**: match fired; day 6 of window; 14 days left in Season.
- **Operational states**: re-entry after failed match ("That wasn't your person. Already looking."), zero-match state ("Your pool is still building. Worth the wait."), profile incomplete ("Profiles under 80% don't receive matches.").

### New in v2
- **Debrief (post-date loop close).** Both people privately report what happened (want a second date / good-not-my-person / no spark in person / didn't happen). Private, never shown to the other person. Feeds matching AND enforces accountability: no-shows lose their place in the pool. This observed-outcomes dataset — "we predicted this pairing, here's what both people reported" — is the moat no incumbent has or can buy.
- **Vouching.** A friend records 30 seconds on why you're worth someone's time. Un-fakeable social proof, high-signal matching data, and every vouch pulls a new person into contact with the product. The referral engine wearing a trust costume.
- **Pool transparency.** Users see: verified pool size, matching confidence, ratio status, waitlist held. "We admit slowly on purpose."
- **Gender-ratio admission control.** When the ratio skews, the waitlist holds (The League-style). Ratio health is an operating metric.
- **Date two through five.** A date-two brief ("last time you talked about X — here's a thread worth pulling"), a nudge at the fizzle point. Whoever owns the early relationship, not the introduction, owns the category.
- **Leave loudly.** When two people exit together, it's a celebrated moment: venue wall card, published annual count. Incumbents bury success because it's churn; we frame it as the product working.

### Cut or deferred (and why)
- **Dual-threshold matching at launch** (Compatibility AND Attraction both clearing a bar). With <75 users this guarantees zero matches. Attraction becomes a soft filter until the pool is real; restore the dual threshold at HIGH confidence.
- **Adaptive per-user weight learning.** Statistical noise below ~150 users / thousands of outcomes. Revisit later.
- **Blurred-photo upgrade moment.** A Tinder mechanic in a nice suit — monetizes frustration. Cut permanently.
- **$29/$99 monthly subscriptions and the Elite tier.** Subscription wants you to stay; that recreates the incumbent incentive rot. See business model.
- **Visible clinical labels** (neuroticism bands, Gottman categories, attachment labels). The science stays under the hood — it informs matching, users never see a label.
- **Employers as community customers.** Cut (HR liability).

## 6. Matching

- Weights (starting point, hand-tuned in the concierge phase): values alignment 40%, attachment style 35%, life stage & energy 25%.
- Modulated by: Language Style Matching, conflict-style complementarity, attraction scoring (soft filter until pool ≥150).
- v1 "engine" is the founder + Claude in an internal matching console: profile synthesis, pairing suggestions with reasoning, Brief generation. The algorithm is learned by being it.
- Debrief outcomes are the training signal. Log every prediction and every outcome from day one.

## 7. Trust architecture

This is the half the original spec missed — and the half women decide on. Every screen a woman sees should quietly answer: *is this safe, and are these people real?*

- **Verification**: voice-verified (the voice note) + photo-verified (liveness selfie) for every profile. 100% or they're not in the pool.
- **First dates at partner venues**: public, staffed, known places. The venue loop is secretly a safety feature — sell it that way.
- **Mid-date check-in**: a discreet "how's it going" with a quiet exit path.
- **Instant removal on report.** One strike for safety issues. Two no-shows = out of the pool.
- **Data stewardship (radioactive-data rules)**:
  - Collect less than we could. Never store raw analysis output longer than needed to produce derived scores.
  - Never show users clinical labels.
  - Photo/voice analysis brushes biometric-privacy law (Illinois BIPA, EU AI Act adjacency) — engineer for data minimization from the schema up; no biometric templates retained.
  - **"When you leave, we delete everything"** is a marketed promise, not a buried setting. Privacy as luxury positioning.

## 8. Business model

- **Season fee, not subscription**: one-time ~$99–199 per 90-day Season, matchmaker-style. We get paid to try to end your search; renewal only happens if we were honest.
- **Free to be in the pool** (you can be matched *with* — this keeps liquidity), **pay to receive your matches** (your Season). Free tier is a waitlist/pool membership, never a degraded product.
- **The promise**: complete your profile, go on 3 dates in your first Season, no meaningful connection → next Season free.
- **Venue sponsorship**: free for the first cohort of venues; paid once we have date-traffic proof. Sponsor gets the Brief placement, wall presence, and a simple "dates hosted" count.
- **Communities** (gyms/clubs/groups, not employers): white-label pools, priced after the concierge phase proves the loop.
- Target: profitable at ~500 paying users, not 500,000.

## 9. Metrics (decide before the first line of backend code)

- **North star: second-date rate per Season.**
- Supporting: intake completion rate (esp. women), debrief completion rate, no-show rate, ratio health, matches-to-date conversion, venue date traffic.
- **Anti-metrics (want these LOW)**: time in app, sessions per week. If we ever optimize DAU, we've become Tinder in a nicer font.

## 10. Brand

- Colors: tomato red (#FF3B2F) ground, white type and controls. No gold, no black.
- Type: Sora throughout; extra-bold headlines, pill buttons, rounded controls.
- Tone: confident, warm, flirty, zero tolerance for games. No emojis.
- **The slash language.** Everything in the /date world takes a slash:
  **/vibe** (your profile — "Your /vibe is your profile"), **/spot** (a
  participating venue), **/night** (a monthly event at a /spot), **/match**,
  **/brief**.
- Copy voice examples: "Your /vibe is your profile." / "Someone in this room might already be on /date." / "That wasn't your person. Already looking."

## 10b. /names, /tags, and the ladder (v3, 2026-09-28)

- **/name**: your unique handle (/maya). Give it out instead of your number.
  The lookup wall shows only name, tag, and "on /date" — never a photo,
  never anything else. Private handles show nothing.
- **/tag**: what you're here for right now. **Curated vocabulary, never
  freeform** — the list is the brand: /looking /casual /fun /tonight /intown
  /slow /open /curious. Shown on the badge and the wall. /tonight also makes
  the /name go dark at midnight.
- **The ladder: /hey → /preview → /chat → /date.** A /hey is tiny and
  one-way. The recipient gets a /preview of the sender's /vibe and decides.
  The yes is an invitation to /chat, which has a 48-hour clock: pick a /spot
  and a time or it closes (zero-ghost, enforced). /chat needs login; not
  built yet.
- One /hey per person per handle, ever. /heys require a claimed /name.
- Badge: print-ready card ("Hi, I'm /maya /looking") with a QR to the /hey
  page. /nights print name tags from the RSVP list.
- Data: `date_handles`, `date_heys`; locked tables, RPC-only access.
- Demo crew (7 seeded /names) at /demo — not real people.

## 10f. /receipts, /founding, /night mode (v7, 2026-09-28)

- **/receipts** (`/receipts`, strip on the homepage): live public numbers —
  pool, founding claimed, verified, introductions, dates set/done, went to
  a /second (the headline rate), passes, ghosts (always 0, by design).
  Zeros are shown honestly before release.
- **/founding** (`/founding`): the numbered wall, #001–#500, public /names
  only. Demo crew holds the first numbers until enrollment opens.
- **/night mode** (`/night/[spot]`): plum-and-pink night theme; live count
  of people in the room (never who); scan in flips your /name to /tonight;
  "I noticed someone." Console gets a **Tonight** tab: each room, who's
  in it, and Val's picks among those present, one tap to introduce.

## 10e. /check, /pass, /second (v6, 2026-09-28)

- **/check**: on a set /date, pick a time; Val's clock (pg_cron → notify
  function, every minute) emails "All good?" with two links. "Get me out"
  files a CHECK-IN report and emails the admins immediately.
- **/pass**: one tap closes a /chat; Val posts the kind close to the other
  person. The anti-ghost mechanic.
- **/second**: twelve hours after a /date, Val emails both "Worth a
  /second?" Two 'second' debriefs and `submit_debrief` opens date two
  (`second_of` links it), new /dare, 48-hour clock.

## 10d. Safety, voice, notifications (v5, 2026-09-28)

Built against the research: burnout (78–79%), ghosting (41%), fakes as the
top complaint, hatred of pay-to-see-likes, human curation converting far
better than apps, voice-first startups rising, verification and check-ins
as the safety features women trust.

- **Hear the sixty seconds.** In the inbox, a /hey or /wing comes with the
  sender's voice note. Recipients can stream it (storage policy scoped to
  pending /heys and /wings). The voice is the /preview.
- **Verified by Val.** A human flag on the /vibe (photos + voice reviewed),
  set from the console, shown on the wall, in the inbox, and on /me.
- **Report / block.** From any /name page (email suffices) or inside a
  /chat (closes it and blocks). Reports land in the console's Reports tab.
  Rule 6 applies: remove first, ask after.
- **Val's emails** (`notify` edge function, Resend): a /hey landed, a /wing
  landed (or an invite if the friend isn't on /date), a /chat opened. One
  per event, in Val's voice. Needs `RESEND_API_KEY` (and a sending domain
  for `NOTIFY_FROM`); without it, silent.
- **/me**: your /name, founding number, verified badge, change /tag or
  private, your /vibe, badge and /hey page links.
- **/privacy** and **/terms**: plain-language drafts for legal review.
- Still never: pay to see who liked you.

## 10c. The signed-in side (v4, 2026-09-28)

- **Login**: Supabase Auth magic link to the email on your /name. No
  passwords. (Supabase's built-in sender is rate-limited; connect real SMTP
  before launch.)
- **Inbox** (`/inbox`): your /heys and /wings as /previews. Yes on a /hey
  opens a /chat; no is silent. Yes on a /wing sends a /hey (consent stays
  two-sided).
- **/chat** (`/chat`): 48-hour ring clock; photos are blurred and sharpen as
  you both write, unlocking at three messages each ("you talked first");
  every /chat gets a **/dare** from Val (one small first-date mission);
  pick a /spot and time to make it a /date; after the date, a private
  **debrief** (second / good-not-my-person / no spark / didn't happen).
- **Debriefs feed Val**: each outcome nudges that person's weights
  (`date_weights`). The engine reads them next.
- **/wing**: "not for me, but I know who." From any /name page, pass the
  /name to a friend (their /name or email). The friend sees only the wall.
  Five a week. Val counts a wing as a strong pairing signal.
- **Founding members**: the first 500 /names claimed get a number
  (#001–#500) on the badge. Open enrollment for 30 days, then release day
  with a /night. Season I is free for founding members.
- **Val's console** (`/console`, admin emails only): Pairs (engine
  suggestions with score, reasons and flags; one tap opens a /chat with
  Val's note), Inbox, People (approve / waitlist / decline), Chats,
  Signals, Debriefs.
- **The engine** (`lib/match.ts`): hard filters on identity/seeking and
  age range wanted; score = /tag chemistry 35 + the eight answers 30 + age
  15 + Charleston cluster 10 + /spot signals 10, plus a /hey or /wing
  between them. Every pair returns reasons in Val's voice, never a number
  to the user.
- Val's AI voice (Claude drafting intros and briefs) needs a server-side
  key; until then Val's notes are templated from the engine's reasons.

## 10a. /spots and /nights (v3, 2026-09-28)

Open to everyone in Charleston — no newcomer gate (transplants are a
marketing channel, not a requirement).

- **/spot**: a venue with the window sticker and a QR that lands on
  `/spot/[slug]`. Scanning in records a check-in. "I noticed someone"
  records a one-line note. Hard rule: **no one can ever see who is checked
  in.** Only the matchmaker sees signals; only a mutual, curated intro
  surfaces. Check-ins also feed matching (shared spots → date venue).
- **/night**: one night a month per /spot. Room of verified singles, first
  hour comped, QR at the door, matchmaker makes intros live. This is the
  cold-start engine: one good /night is 60 people in the pool.
- Venue ask (all three or no sticker): window sticker, host a monthly
  /night, comp the first round for introduced couples.
- Data: `date_signals` (kind: checkin | notice | rsvp), insert-only for anon.
- Venues and their next /night live in `lib/venues.ts` until the console
  manages them.

## 11. Stack

- Next.js 14 (App Router), Supabase (Postgres + Auth + Storage), Anthropic Claude API, Stripe, Tailwind CSS, Vercel.
- **PWA for v1** — matches are rare events, so email/SMS carry notifications; sidesteps App Store review. Native app is a success problem, not a launch problem.
- Claude API usage in v1: profile synthesis, pairing suggestions (console), narrative generation, Brief generation, voice-note transcription/analysis. Watch per-user AI cost against Season revenue.

## 12. Build order

- **Week 1**: Landing page + intake flow (~8 questions, photos, voice note) on Next.js + Supabase. Put it in front of one community. → starts the kill-condition test.
- **Weeks 2–4**: Internal matching console (Claude copilot: synthesis, pairing suggestions, Brief drafts). Match-reveal page. Debrief flow. Do 10 matches by hand.
- **Month 2–3**: Automate only what's been done manually 50 times. Stripe when someone hits the pay wall — not before. First venue QR moments.
- **Later (earned, not assumed)**: automated matching engine, dual-threshold restoration, vouching flow, date-two briefs, sponsor billing, communities white-label, native app.

## 13. Why incumbents can't follow

Match Group structurally cannot adopt pay-per-season, success-based economics — it cannibalizes subscription revenue. Classic innovator's dilemma. Combined with local venue density, the vouching trust layer, and the observed-outcomes dataset from debriefs, the moat compounds with every Season.

---

## Current state (2026-08-19)

- Repo: empty except this spec. No production code written.
- Interactive design preview (7 screens: Welcome, Scan/venue entry, Profiling, Match, Brief, Debrief, Pool) exists as a Claude artifact — the visual direction is settled.
- Open questions for the founder: which city/scene is the first pool; founder's willingness to hand-match cohort 1 (recommended: yes); final Season price point; status of the previously-built sponsor component (referenced in conversation, not in this repo).
- Next action: Week 1 build — landing page + intake flow.

## 10g. On the phone — PWA, push, keys (v8)

/date is installed, not downloaded. No app store, no review queue, no
30% cut. The web app is the app.

**Install.** `app/manifest.ts` (standalone, portrait, tomato theme, shortcuts
to Inbox, /chat, /me), icons in `public/icons` and `app/icon.svg` /
`app/apple-icon.png` (generated by `scripts/icons.mjs`). The Install card
(`app/install.tsx`) shows once per phone: Android gets the real prompt,
iPhone gets "Share → Add to Home Screen". It lives on the badge page and
under every signed-in screen.

**Offline.** `public/sw.js`: pages network-first with an `/offline/`
fallback, static assets and demo photos cache-first. Supabase is never
cached. Updates swap in silently on the next load. `app/pwa.tsx` registers
it; `next.config.mjs` serves it with no-cache.

**Mobile rules.** Dynamic viewport height everywhere (`min-h-dvh`), safe-area
padding on the body and a `.page` class for screens with their own ground,
inputs never under 16px (no iOS zoom), every inline text link carries a
thumb-sized hit area. Audited at iPhone size on every route: zero horizontal
overflow.

**Push.** Val's notes on the lock screen: a /hey, a /wing, a /chat opening,
the check-in, the morning after, and a "get me out" alert for Val's people.
Nothing else, ever. `app/push.tsx` asks once (iPhone: only after install),
subscribes, and saves through `date_save_push()`. `date_push_subs` has no
policies; the browser only ever goes through the RPCs. The `notify`
function sends with `web-push`; dead endpoints (404/410) are deleted.

**Keys.** Function secrets first, else Supabase Vault through
`date_secret()`, which only the service role may call. Resend is in Vault
now. The VAPID pair is generated by `notify` itself on first run and kept
in Vault; the public half is readable by anyone via `date_push_key()` (it
is public by design). The Anthropic key is the one thing still unset: add
it as a function secret named ANTHROPIC_API_KEY, or store it in Vault
under the same name, and Val's brain switches on. `{"kind":"status"}` on
`notify` reports booleans for all three.

## 10h. Own project (v9)

/date moved off the shared database to its own Supabase project, `date`
(ref bjnfxgdulhmqktqqezro, us-east-1). fundraiser-platform was paused to
make room under the free tier's two-active-project cap.

- Schema replayed in two migrations (`date_replay_1_…`, `date_replay_2_…`),
  functions in their final form, plus `date_seed_demo_and_e2e_cleanup`
  (the 17 demo profiles, the `/val` handle, and a cleanup that removes
  every row a test run touches, in FK order).
- Functions `val` and `notify` deployed there. The Resend key was handed
  from the old database to the new one database-to-database through a
  one-time token; the handoff function is retired. New VAPID pair.
- Clock job `date-val-clock` now runs on the new project; the old one is
  unscheduled. The old `date_` tables stay on the shared project, untouched,
  as a backup. No real members existed yet, so nothing personal moved.
- Vercel env and the GitHub workflow point at the new URL and anon key.
- Still the owner's: Auth → URL Configuration (Site URL and redirect list)
  on the new project, and the Anthropic key.
