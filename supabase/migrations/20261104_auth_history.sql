begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9._-]{3,32}$'),
  username_normalized text generated always as (lower(username)) stored,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_normalized_key
  on public.profiles (username_normalized);

create table if not exists public.measurement_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  measured_on date,
  machine text not null,
  chamber text not null default '',
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists measurement_history_owner_created_idx
  on public.measurement_history (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.measurement_history enable row level security;
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.measurement_history to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists measurement_history_select_own on public.measurement_history;
create policy measurement_history_select_own on public.measurement_history
  for select using ((select auth.uid()) = user_id);

drop policy if exists measurement_history_insert_own on public.measurement_history;
create policy measurement_history_insert_own on public.measurement_history
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists measurement_history_update_own on public.measurement_history;
create policy measurement_history_update_own on public.measurement_history
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists measurement_history_delete_own on public.measurement_history;
create policy measurement_history_delete_own on public.measurement_history
  for delete using ((select auth.uid()) = user_id);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
begin
  requested_username := nullif(btrim(new.raw_user_meta_data ->> 'username'), '');
  if requested_username is null or requested_username !~ '^[A-Za-z0-9._-]{3,32}$' then
    raise exception using errcode = '23514', message = 'A valid username is required';
  end if;

  insert into public.profiles (id, username)
  values (new.id, requested_username);
  return new;
end;
$$;

revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

commit;