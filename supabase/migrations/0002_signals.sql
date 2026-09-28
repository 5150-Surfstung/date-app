-- /spot signals: check-ins, "I noticed someone" notes, and /night RSVPs.
-- Applied as migration `date_signals_v1`.
--
-- Hard rule: nothing here is ever readable by the public. Check-ins are
-- never shown to other users; only the matchmaker sees them, and only a
-- mutual, curated intro ever surfaces.

create table if not exists date_signals (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  kind        text not null check (kind in ('checkin', 'notice', 'rsvp')),
  venue_slug  text not null references date_venues (slug),
  email       text not null,
  note        text
);

create index if not exists date_signals_venue_idx on date_signals (venue_slug, created_at desc);
create index if not exists date_signals_email_idx on date_signals (email);

alter table date_signals enable row level security;

create policy "anon can send signals"
  on date_signals for insert
  to anon
  with check (true);

update date_venues
set area = 'Downtown Charleston',
    perk = 'Introduced couples get the corner table and the first round on the house.'
where slug = 'golden-hour';
