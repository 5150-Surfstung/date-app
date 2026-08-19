-- /date · Week 1 schema: intake + venues.
-- Deliberately minimal (see SPEC.md §7 data stewardship): we store what the
-- concierge phase needs and nothing speculative. No derived psychological
-- labels are persisted — analysis happens at matching time.

create table venues (
  slug        text primary key,
  name        text not null,
  area        text,
  perk        text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table applications (
  id             uuid primary key,
  created_at     timestamptz not null default now(),
  venue_slug     text references venues (slug),
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

create index applications_status_idx on applications (status);
create index applications_venue_idx  on applications (venue_slug);

-- Row-level security: the intake API uses the service role; nothing is
-- readable with the anon key.
alter table applications enable row level security;
alter table venues enable row level security;

create policy "venues are publicly readable"
  on venues for select using (active);

-- Storage bucket for intake media (photos + voice notes), private.
insert into storage.buckets (id, name, public)
values ('intake', 'intake', false)
on conflict (id) do nothing;

-- Seed the first venue partner.
insert into venues (slug, name, area, perk) values
  ('golden-hour', 'Golden Hour Coffee', 'East Nashville',
   'First dates here get the corner table and a round on the house.');
