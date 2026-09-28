-- /names: claim a handle, the lookup wall, and /hey.
-- Applied as migration `date_handles_v1`.
--
-- Both tables are locked (RLS on, no anon policies). Everything goes
-- through security-definer functions so the rules live in one place:
--   * the wall never returns more than {taken, open, name}
--   * a /hey requires the sender to have a claimed /name
--   * one /hey per sender per handle, ever
--   * you can't /hey a private handle, or yourself

create table if not exists date_handles (
  handle        text primary key check (handle ~ '^[a-z0-9_]{3,20}$'),
  email         text not null unique,
  name          text not null,
  visibility    text not null default 'public'
                check (visibility in ('public', 'private', 'tonight')),
  tonight_until timestamptz,
  created_at    timestamptz not null default now()
);
alter table date_handles enable row level security;

create table if not exists date_heys (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  to_handle   text not null references date_handles (handle),
  from_email  text not null references date_handles (email),
  note        text,
  status      text not null default 'sent'
              check (status in ('sent', 'previewed', 'accepted', 'passed')),
  unique (to_handle, from_email)
);
alter table date_heys enable row level security;

-- Midnight tonight, Charleston time.
create or replace function date_midnight_tonight() returns timestamptz
language sql stable as $$
  select (((now() at time zone 'America/New_York')::date + 1)::timestamp)
         at time zone 'America/New_York'
$$;

create or replace function claim_handle(p_handle text, p_email text, p_name text, p_vis text)
returns text language plpgsql security definer set search_path = public as $$
declare h text := lower(trim(p_handle)); e text := lower(trim(p_email));
begin
  if h !~ '^[a-z0-9_]{3,20}$' or e !~ '.+@.+\..+' or length(trim(p_name)) = 0 then
    return 'bad';
  end if;
  if h in ('date','vibe','spot','night','hey','preview','claim','apply','at','badge',
           'admin','help','support','about','team','nights','spots','me') then
    return 'reserved';
  end if;
  if p_vis not in ('public','private','tonight') then return 'bad'; end if;
  if exists (select 1 from date_handles where handle = h) then return 'taken'; end if;
  if exists (select 1 from date_handles where email = e) then return 'email_taken'; end if;
  insert into date_handles (handle, email, name, visibility, tonight_until)
  values (h, e, trim(p_name), p_vis,
          case when p_vis = 'tonight' then date_midnight_tonight() end);
  return 'ok';
end $$;

create or replace function handle_wall(p_handle text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r date_handles;
begin
  select * into r from date_handles where handle = lower(trim(p_handle));
  if not found then return jsonb_build_object('taken', false); end if;
  if r.visibility = 'public'
     or (r.visibility = 'tonight' and r.tonight_until > now()) then
    return jsonb_build_object('taken', true, 'open', true, 'name', r.name);
  end if;
  return jsonb_build_object('taken', true, 'open', false);
end $$;

create or replace function send_hey(p_to text, p_from_email text, p_note text)
returns text language plpgsql security definer set search_path = public as $$
declare s date_handles; t date_handles;
begin
  select * into s from date_handles where email = lower(trim(p_from_email));
  if not found then return 'no_vibe'; end if;
  select * into t from date_handles where handle = lower(trim(p_to));
  if not found then return 'no_handle'; end if;
  if t.email = s.email then return 'self'; end if;
  if not (t.visibility = 'public'
          or (t.visibility = 'tonight' and t.tonight_until > now())) then
    return 'closed';
  end if;
  insert into date_heys (to_handle, from_email, note)
  values (t.handle, s.email, nullif(trim(coalesce(p_note, '')), ''))
  on conflict (to_handle, from_email) do nothing;
  if not found then return 'dupe'; end if;
  return 'ok';
end $$;

-- Pre-auth: knowing both handle and email is the credential for now.
create or replace function set_visibility(p_handle text, p_email text, p_vis text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_vis not in ('public','private','tonight') then return false; end if;
  update date_handles
     set visibility = p_vis,
         tonight_until = case when p_vis = 'tonight' then date_midnight_tonight() end
   where handle = lower(trim(p_handle)) and email = lower(trim(p_email));
  return found;
end $$;

revoke all on function claim_handle(text,text,text,text) from public;
revoke all on function handle_wall(text) from public;
revoke all on function send_hey(text,text,text) from public;
revoke all on function set_visibility(text,text,text) from public;
grant execute on function claim_handle(text,text,text,text) to anon;
grant execute on function handle_wall(text) to anon;
grant execute on function send_hey(text,text,text) to anon;
grant execute on function set_visibility(text,text,text) to anon;
