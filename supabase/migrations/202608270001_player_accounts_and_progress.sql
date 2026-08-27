-- 中国城市填充挑战：玩家账号、云存档与管理员只读后台
-- 在 Supabase SQL Editor 中可整段执行。

create table if not exists public.player_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'player' check (role in ('player', 'admin')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists player_profiles_email_lower_idx
  on public.player_profiles (lower(email));
create index if not exists player_profiles_last_seen_idx
  on public.player_profiles (last_seen_at desc);

create table if not exists public.user_progress (
  user_id uuid primary key references public.player_profiles(id) on delete cascade,
  schema_version integer not null default 1 check (schema_version > 0),
  revision bigint not null default 1 check (revision > 0),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_progress_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint user_progress_payload_size check (octet_length(payload::text) <= 524288)
);

create index if not exists user_progress_updated_at_idx
  on public.user_progress (updated_at desc);

create table if not exists public.progress_backups (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.player_profiles(id) on delete cascade,
  revision bigint not null,
  schema_version integer not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists progress_backups_user_created_idx
  on public.progress_backups (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.player_profiles (id, email, created_at, last_seen_at, updated_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.created_at, now()),
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_china_city_player_user_changed on auth.users;
create trigger on_china_city_player_user_changed
  after insert or update of email on auth.users
  for each row execute function public.handle_auth_user();

insert into public.player_profiles (id, email, created_at, last_seen_at, updated_at)
select id, coalesce(email, ''), created_at, now(), now()
from auth.users
on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.player_profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function public.touch_player_profile()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.player_profiles
  set last_seen_at = now(), updated_at = now()
  where id = (select auth.uid());
$$;

create or replace function public.backup_user_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.payload is distinct from new.payload then
    insert into public.progress_backups (
      user_id,
      revision,
      schema_version,
      payload
    ) values (
      old.user_id,
      old.revision,
      old.schema_version,
      old.payload
    );

    delete from public.progress_backups
    where id in (
      select id
      from public.progress_backups
      where user_id = old.user_id
      order by created_at desc, id desc
      offset 20
    );
  end if;
  return new;
end;
$$;

drop trigger if exists set_player_profiles_updated_at on public.player_profiles;
create trigger set_player_profiles_updated_at
  before update on public.player_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists backup_user_progress_before_update on public.user_progress;
create trigger backup_user_progress_before_update
  before update on public.user_progress
  for each row execute function public.backup_user_progress();

drop trigger if exists set_user_progress_updated_at on public.user_progress;
create trigger set_user_progress_updated_at
  before update on public.user_progress
  for each row execute function public.set_updated_at();

alter table public.player_profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.progress_backups enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.player_profiles;
create policy "profiles_select_self_or_admin"
  on public.player_profiles
  for select
  to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "progress_select_self_or_admin" on public.user_progress;
create policy "progress_select_self_or_admin"
  on public.user_progress
  for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "progress_insert_self" on public.user_progress;
create policy "progress_insert_self"
  on public.user_progress
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "progress_update_self" on public.user_progress;
create policy "progress_update_self"
  on public.user_progress
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "progress_delete_self" on public.user_progress;
create policy "progress_delete_self"
  on public.user_progress
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "backups_select_self_or_admin" on public.progress_backups;
create policy "backups_select_self_or_admin"
  on public.progress_backups
  for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

revoke all on table public.player_profiles from anon;
revoke all on table public.user_progress from anon;
revoke all on table public.progress_backups from anon;
revoke all on table public.player_profiles from authenticated;
revoke all on table public.user_progress from authenticated;
revoke all on table public.progress_backups from authenticated;

grant select on table public.player_profiles to authenticated;
grant select, insert, update, delete on table public.user_progress to authenticated;
grant select on table public.progress_backups to authenticated;
revoke all on function public.handle_auth_user() from public;
revoke all on function public.backup_user_progress() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.touch_player_profile() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.touch_player_profile() to authenticated;
