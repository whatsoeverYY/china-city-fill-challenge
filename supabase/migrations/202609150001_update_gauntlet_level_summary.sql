-- 闯关存档改用永久稳定 ID。数据库只汇总通关 ID，不感知关卡顺序或当前目录。

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
    payload -> 'values' ->> 'china-city-fill-gauntlet-completed-level-ids-v1',
    '[]'::jsonb
  );
  mistakes jsonb := public.safe_parse_jsonb(
    payload -> 'values' ->> 'china-city-fill-gauntlet-mistakes-v1', '[]'::jsonb
  );
  completed_provinces integer;
  partial_provinces integer;
  placed_names integer;
  completed_neighbor_challenges integer;
  completed_level_ids jsonb;
  completed_levels integer;
begin
  if jsonb_typeof(map_progress) <> 'object' then
    map_progress := '{}'::jsonb;
  end if;
  if jsonb_typeof(neighbor_progress) <> 'object' then
    neighbor_progress := '{}'::jsonb;
  end if;
  if jsonb_typeof(levels) <> 'array' then
    levels := '[]'::jsonb;
  end if;
  if jsonb_typeof(mistakes) <> 'array' then
    mistakes := '[]'::jsonb;
  end if;

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

  select coalesce(
    jsonb_agg(to_jsonb(valid_level.level_id) order by valid_level.level_id),
    '[]'::jsonb
  ) into completed_level_ids
  from (
    select distinct entry.value as level_id
    from jsonb_array_elements_text(levels) as entry(value)
    where entry.value ~ '^[a-z][a-z0-9]*(-[a-z0-9]+)*$'
  ) as valid_level;

  completed_levels := jsonb_array_length(completed_level_ids);

  return jsonb_build_object(
    'completedProvinces', completed_provinces,
    'partialProvinces', partial_provinces,
    'placedNames', placed_names,
    'completedNeighborChallenges', completed_neighbor_challenges,
    'completedLevelIds', completed_level_ids,
    'completedLevels', completed_levels,
    'mistakes', jsonb_array_length(mistakes)
  );
end;
$$;

alter table public.user_progress_summaries
  add column if not exists completed_level_ids jsonb not null default '[]'::jsonb;

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
    completed_neighbor_challenges, completed_levels, mistakes,
    completed_level_ids
  ) values (
    new.user_id, new.schema_version, new.revision, new.updated_at, new.reset_at,
    (summary ->> 'completedProvinces')::integer,
    (summary ->> 'partialProvinces')::integer,
    (summary ->> 'placedNames')::integer,
    (summary ->> 'completedNeighborChallenges')::integer,
    (summary ->> 'completedLevels')::integer,
    (summary ->> 'mistakes')::integer,
    summary -> 'completedLevelIds'
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
    mistakes = excluded.mistakes,
    completed_level_ids = excluded.completed_level_ids;
  return new;
end;
$$;

insert into public.user_progress_summaries (
  user_id, schema_version, revision, progress_updated_at, reset_at,
  completed_provinces, partial_provinces, placed_names,
  completed_neighbor_challenges, completed_levels, mistakes,
  completed_level_ids
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
  (summary.value ->> 'mistakes')::integer,
  summary.value -> 'completedLevelIds'
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
  mistakes = excluded.mistakes,
  completed_level_ids = excluded.completed_level_ids;

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
  mistakes,
  completed_level_ids
from public.user_progress_summaries;
