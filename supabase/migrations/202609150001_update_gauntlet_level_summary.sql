-- 闯关模式调整为连续编号的 23 关后，同时兼容 v5 的旧关卡 ID。

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
  levels jsonb;
  uses_current_levels boolean;
  mistakes jsonb := public.safe_parse_jsonb(
    payload -> 'values' ->> 'china-city-fill-gauntlet-mistakes-v1', '[]'::jsonb
  );
  completed_provinces integer;
  partial_provinces integer;
  placed_names integer;
  completed_neighbor_challenges integer;
  completed_levels integer;
begin
  uses_current_levels := (payload -> 'values') ?
    'china-city-fill-gauntlet-progress-v6';
  levels := public.safe_parse_jsonb(
    case
      when uses_current_levels then
        payload -> 'values' ->> 'china-city-fill-gauntlet-progress-v6'
      else
        payload -> 'values' ->> 'china-city-fill-gauntlet-progress-v5'
    end,
    '[]'::jsonb
  );

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

  if uses_current_levels then
    select count(distinct entry.value)::integer into completed_levels
    from jsonb_array_elements_text(levels) as entry(value)
    where entry.value = any(array[
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
      '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'
    ]);
  else
    select count(distinct entry.value)::integer into completed_levels
    from jsonb_array_elements_text(levels) as entry(value)
    where entry.value = any(array[
      '1', '2', '4', '5', '6', '8', '9', '10', '11', '12', '13', '14',
      '15', '16', '17', '18', '20', '21', '22', '23', '24', '25', '26'
    ]);
  end if;

  return jsonb_build_object(
    'completedProvinces', completed_provinces,
    'partialProvinces', partial_provinces,
    'placedNames', placed_names,
    'completedNeighborChallenges', completed_neighbor_challenges,
    'completedLevels', completed_levels,
    'mistakes', jsonb_array_length(mistakes)
  );
end;
$$;

update public.user_progress_summaries as summary
set completed_levels = (
  public.summarize_progress_payload(progress.payload) ->> 'completedLevels'
)::integer
from public.user_progress as progress
where progress.user_id = summary.user_id;
