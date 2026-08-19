# /date

Your vibe is your profile. Three matches. No games. Real people.

Read `SPEC.md` for the full product spec, strategy, and build order.

## Current state — Week 1

- Landing page (venue-QR aware: `/?v=golden-hour` shows the venue partner banner)
- Intake flow at `/apply`: basics → 8 questions → photos (3–10) → 60-second voice note
- `POST /api/apply` persists applications:
  - with Supabase configured → `applications` table + private `intake` storage bucket
  - without → local `.data/` directory (dev fallback)
- Schema in `supabase/migrations/0001_intake.sql`

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000        (landing)
# open http://localhost:3000/?v=golden-hour   (venue QR entry)
# open http://localhost:3000/apply  (intake)
```

To wire up Supabase: create a project, run the migration in `supabase/migrations/`,
copy `.env.example` to `.env.local` and fill in the values.
