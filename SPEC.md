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

- Colors: obsidian black + warm gold.
- Type: Cormorant Garamond (display) + DM Mono (body).
- Tone: confident, warm, zero tolerance for games. No emojis. No gamification chrome. Luxury tech, not toy app.
- Copy voice examples: "Someone worth your time is waiting." / "That wasn't your person. Already looking." / "We admit slowly on purpose."

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
