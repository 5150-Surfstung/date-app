-- /tags: what you're here for right now. Curated vocabulary, never freeform.
-- Applied as migration `date_tags_v1`.
--
-- /tonight is also the tonight-only setting: the /name goes dark at midnight.

alter table date_handles
  add column if not exists tag text
  check (tag in ('looking','casual','fun','tonight','intown','slow','open','curious'));

drop function if exists claim_handle(text, text, text, text);

create or replace function claim_handle(p_handle text, p_email text, p_name text, p_tag text, p_private boolean)
returns text language plpgsql security definer set search_path = public as $$
declare h text := lower(trim(p_handle)); e text := lower(trim(p_email)); vis text;
begin
  if h !~ '^[a-z0-9_]{3,20}$' or e !~ '.+@.+\..+' or length(trim(p_name)) = 0 then
    return 'bad';
  end if;
  if h in ('date','vibe','spot','night','hey','preview','chat','claim','apply','at','badge',
           'admin','help','support','about','team','nights','spots','me','demo',
           'looking','casual','fun','tonight','intown','slow','open','curious') then
    return 'reserved';
  end if;
  if p_tag is not null and p_tag not in ('looking','casual','fun','tonight','intown','slow','open','curious') then
    return 'bad';
  end if;
  if exists (select 1 from date_handles where handle = h) then return 'taken'; end if;
  if exists (select 1 from date_handles where email = e) then return 'email_taken'; end if;
  vis := case when p_private then 'private' when p_tag = 'tonight' then 'tonight' else 'public' end;
  insert into date_handles (handle, email, name, tag, visibility, tonight_until)
  values (h, e, trim(p_name), p_tag, vis,
          case when p_tag = 'tonight' then date_midnight_tonight() end);
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
    return jsonb_build_object('taken', true, 'open', true, 'name', r.name, 'tag', r.tag);
  end if;
  return jsonb_build_object('taken', true, 'open', false);
end $$;

-- Change your tag any time. Pre-auth: handle + email is the credential.
create or replace function set_tag(p_handle text, p_email text, p_tag text, p_private boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_tag is not null and p_tag not in ('looking','casual','fun','tonight','intown','slow','open','curious') then
    return false;
  end if;
  update date_handles
     set tag = p_tag,
         visibility = case when p_private then 'private' when p_tag = 'tonight' then 'tonight' else 'public' end,
         tonight_until = case when p_tag = 'tonight' then date_midnight_tonight() end
   where handle = lower(trim(p_handle)) and email = lower(trim(p_email));
  return found;
end $$;

revoke all on function claim_handle(text,text,text,text,boolean) from public;
revoke all on function set_tag(text,text,text,boolean) from public;
grant execute on function claim_handle(text,text,text,text,boolean) to anon;
grant execute on function set_tag(text,text,text,boolean) to anon;

update date_handles set tag = v.tag from (values
  ('maya','looking'), ('theo','open'), ('priya','tonight'), ('jules','intown'),
  ('marcus','slow'), ('sloane','fun'), ('dez','tonight')
) as v(handle, tag) where date_handles.handle = v.handle;
