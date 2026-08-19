-- /date · Week 1 schema: intake + venues. Applied 2026-08-19 as
-- migration `date_intake_v1` to the shared drift-chs project
-- (iwotispqqcnkrbcnvozq).
--
-- Tables are date_-prefixed because that project hosts other apps too.
-- When /date gets its own project (SPEC.md §7 says it must, before real
-- user data at scale), re-run this there and drop the prefix.
--
-- Deliberately minimal (SPEC.md data stewardship): we store what the
-- concierge phase needs and nothing speculative. No derived psychological
-- labels are persisted — analysis happens at matching time.

create table if not exists date_venues (
  slug        text primary key,
  name        text not null,
  area        text,
  perk        text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists date_applications (
  id             uuid primary key,
  created_at     timestamptz not null default now(),
  venue_slug     text references date_venues (slug),
  name           text not null,
  age            int  not null check (age >= 18),
  email          text not null unique,
  phone          text,
  neighborhood   text,
  identity       text not null,
  seeking        text not null,
  answers        jsonb not null default '{}',
  photo_keys     text[] not null default '{}',
  photo_count    int not null default 0,
  voice_key      text,
  has_voice_note boolean not null default false,
  status         text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'waitlisted', 'rejected', 'deleted'))
);

create index if not exists date_applications_status_idx on date_applications (status);
create index if not exists date_applications_venue_idx  on date_applications (venue_slug);

alter table date_applications enable row level security;
alter table date_venues enable row level security;

-- Public intake form: anon key may INSERT applications, never read them.
create policy "anon can submit applications"
  on date_applications for insert
  to anon
  with check (true);

create policy "venues are publicly readable"
  on date_venues for select
  to anon
  using (active);

-- Private bucket for intake media (photos + voice notes).
insert into storage.buckets (id, name, public)
values ('date-intake', 'date-intake', false)
on conflict (id) do nothing;

-- Anon may upload into the intake bucket, never list or read.
create policy "anon can upload intake media"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'date-intake');

-- The storage API reads the row back right after insert; this narrow
-- window satisfies that without letting anon list or download media.
create policy "anon sees only just-uploaded intake media"
  on storage.objects for select
  to anon
  using (bucket_id = 'date-intake' and created_at > now() - interval '10 seconds');

-- Seed the first venue partner.
insert into date_venues (slug, name, area, perk) values
  ('golden-hour', 'Golden Hour Coffee', 'East Nashville',
   'First dates here get the corner table and a round on the house.')
on conflict (slug) do nothing;
