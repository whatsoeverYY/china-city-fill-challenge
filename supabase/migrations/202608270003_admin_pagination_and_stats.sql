-- 管理员后台：增量进度摘要、全局统计、分页支持和存档版本保护。

create or replace function public.safe_parse_jsonb(
  raw_value text,
  fallback jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  parsed jsonb;
begin
  if raw_value is null then
    return fallback;
  end if;
  parsed := raw_value::jsonb;
  if jsonb_typeof(parsed) is distinct from jsonb_typeof(fallback) then
    return fallback;
  end if;
  return parsed;
exception when others then
  return fallback;
end;
$$;

create or replace function public.summarize_progress_payload(payload jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  map_progress jsonb := public.safe_parse_jsonb(
    payload -> 'values' ->> 'china-city-fill-progress-v1', '{}'::jsonb
  );
  neighbor_progress jsonb := public.safe_parse_jsonb(
    payload -> 'values' ->> 'china-city-fill-neighbor-progress-v1', '{}'::jsonb
  );
  levels jsonb := public.safe_parse_jsonb(
    payload -> 'values' ->> 'china-city-fill-gauntlet-progress-v5', '[]'::jsonb
  );
  mistakes jsonb := public.safe_parse_jsonb(
    payload -> 'values' ->> 'china-city-fill-gauntlet-mistakes-v1', '[]'::jsonb
  );
  completed_provinces integer;
  partial_provinces integer;
  placed_names integer;
  completed_neighbor_challenges integer;
begin
  select count(*)::integer into completed_provinces
  from jsonb_each(map_progress) as entry
  where jsonb_typeof(entry.value) = 'array'
    and entry.value ? '__complete__';

  select count(*)::integer into partial_provinces
  from jsonb_each(map_progress) as entry
  where jsonb_typeof(entry.value) = 'array'
    and jsonb_array_length(entry.value) > 0
    and not (entry.value ? '__complete__');

  select coalesce(sum(
    jsonb_array_length(entry.value) -
    case when entry.value ? '__complete__' then 1 else 0 end
  ), 0)::integer into placed_names
  from jsonb_each(map_progress) as entry
  where jsonb_typeof(entry.value) = 'array';

  select count(*)::integer into completed_neighbor_challenges
  from jsonb_each(neighbor_progress) as entry
  where jsonb_typeof(entry.value) = 'array'
    and entry.value ? '__complete__';

  return jsonb_build_object(
    'completedProvinces', completed_provinces,
    'partialProvinces', partial_provinces,
    'placedNames', placed_names,
    'completedNeighborChallenges', completed_neighbor_challenges,
    'completedLevels', jsonb_array_length(levels),
    'mistakes', jsonb_array_length(mistakes)
  );
end;
$$;

create or replace function public.enforce_progress_schema_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  payload_version integer;
begin
  if tg_op = 'UPDATE' and new.schema_version < old.schema_version then
    raise exception 'progress schema downgrade is not allowed'
      using errcode = '23514';
  end if;

  begin
    payload_version := (new.payload ->> 'schemaVersion')::integer;
  exception when others then
    payload_version := null;
  end;
  if payload_version is null or payload_version <> new.schema_version then
    raise exception 'progress payload schema version mismatch'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_progress_schema_version_before_write
  on public.user_progress;
create trigger enforce_progress_schema_version_before_write
  before insert or update on public.user_progress
  for each row execute function public.enforce_progress_schema_version();

create table if not exists public.user_progress_summaries (
  user_id uuid primary key references public.player_profiles(id) on delete cascade,
  schema_version integer not null,
  revision bigint not null,
  progress_updated_at timestamptz not null,
  reset_at timestamptz,
  completed_provinces integer not null default 0,
  partial_provinces integer not null default 0,
  placed_names integer not null default 0,
  completed_neighbor_challenges integer not null default 0,
  completed_levels integer not null default 0,
  mistakes integer not null default 0
);

create or replace function public.refresh_user_progress_summary()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  summary jsonb := public.summarize_progress_payload(new.payload);
begin
  insert into public.user_progress_summaries (
    user_id, schema_version, revision, progress_updated_at, reset_at,
    completed_provinces, partial_provinces, placed_names,
    completed_neighbor_challenges, completed_levels, mistakes
  ) values (
    new.user_id, new.schema_version, new.revision, new.updated_at, new.reset_at,
    (summary ->> 'completedProvinces')::integer,
    (summary ->> 'partialProvinces')::integer,
    (summary ->> 'placedNames')::integer,
    (summary ->> 'completedNeighborChallenges')::integer,
    (summary ->> 'completedLevels')::integer,
    (summary ->> 'mistakes')::integer
  )
  on conflict (user_id) do update set
    schema_version = excluded.schema_version,
    revision = excluded.revision,
    progress_updated_at = excluded.progress_updated_at,
    reset_at = excluded.reset_at,
    completed_provinces = excluded.completed_provinces,
    partial_provinces = excluded.partial_provinces,
    placed_names = excluded.placed_names,
    completed_neighbor_challenges = excluded.completed_neighbor_challenges,
    completed_levels = excluded.completed_levels,
    mistakes = excluded.mistakes;
  return new;
end;
$$;

drop trigger if exists refresh_user_progress_summary_after_write
  on public.user_progress;
create trigger refresh_user_progress_summary_after_write
  after insert or update on public.user_progress
  for each row execute function public.refresh_user_progress_summary();

insert into public.user_progress_summaries (
  user_id, schema_version, revision, progress_updated_at, reset_at,
  completed_provinces, partial_provinces, placed_names,
  completed_neighbor_challenges, completed_levels, mistakes
)
select
  progress.user_id,
  progress.schema_version,
  progress.revision,
  progress.updated_at,
  progress.reset_at,
  (summary.value ->> 'completedProvinces')::integer,
  (summary.value ->> 'partialProvinces')::integer,
  (summary.value ->> 'placedNames')::integer,
  (summary.value ->> 'completedNeighborChallenges')::integer,
  (summary.value ->> 'completedLevels')::integer,
  (summary.value ->> 'mistakes')::integer
from public.user_progress as progress
cross join lateral (
  select public.summarize_progress_payload(progress.payload) as value
) as summary
on conflict (user_id) do update set
  schema_version = excluded.schema_version,
  revision = excluded.revision,
  progress_updated_at = excluded.progress_updated_at,
  reset_at = excluded.reset_at,
  completed_provinces = excluded.completed_provinces,
  partial_provinces = excluded.partial_provinces,
  placed_names = excluded.placed_names,
  completed_neighbor_challenges = excluded.completed_neighbor_challenges,
  completed_levels = excluded.completed_levels,
  mistakes = excluded.mistakes;

alter table public.user_progress_summaries enable row level security;
drop policy if exists "progress_summaries_select_self_or_admin"
  on public.user_progress_summaries;
create policy "progress_summaries_select_self_or_admin"
  on public.user_progress_summaries
  for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create or replace view public.admin_progress_summaries
with (security_invoker = true)
as
select
  user_id,
  schema_version,
  revision,
  progress_updated_at as updated_at,
  reset_at,
  completed_provinces,
  partial_provinces,
  placed_names,
  completed_neighbor_challenges,
  completed_levels,
  mistakes
from public.user_progress_summaries;

create or replace function public.get_admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'administrator permission required' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'total', (select count(*) from public.player_profiles),
    'withSave', (select count(*) from public.user_progress_summaries),
    'activeSevenDays', (
      select count(*)
      from public.player_profiles
      where last_seen_at >= now() - interval '7 days'
    ),
    'passedLevels', coalesce((
      select sum(completed_levels)
      from public.user_progress_summaries
    ), 0)
  );
end;
$$;

revoke all on table public.user_progress_summaries from anon;
revoke all on table public.user_progress_summaries from authenticated;
revoke all on table public.admin_progress_summaries from public;
revoke all on function public.safe_parse_jsonb(text, jsonb) from public;
revoke all on function public.summarize_progress_payload(jsonb) from public;
revoke all on function public.enforce_progress_schema_version() from public;
revoke all on function public.refresh_user_progress_summary() from public;
revoke all on function public.get_admin_dashboard_stats() from public;

grant select on table public.user_progress_summaries to authenticated;
grant select on table public.admin_progress_summaries to authenticated;
grant execute on function public.get_admin_dashboard_stats() to authenticated;
