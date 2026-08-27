-- 清除存档时继承数据库中的实际 schema 版本，避免未来升级后被防降级触发器拒绝。

create or replace function public.clear_player_progress(target_user_id uuid default null)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_id uuid := (select auth.uid());
  resolved_user_id uuid := coalesce(target_user_id, requester_id);
  resolved_schema_version integer := 1;
  reset_at timestamptz := clock_timestamp();
  reset_payload jsonb;
begin
  if requester_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if resolved_user_id is null then
    raise exception 'target user is required' using errcode = '22023';
  end if;

  if resolved_user_id <> requester_id and not public.is_admin() then
    raise exception 'administrator permission required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.player_profiles
    where id = resolved_user_id
  ) then
    raise exception 'player not found' using errcode = 'P0002';
  end if;

  -- 锁定已有存档，避免清除与同步同时发生时读取到过期版本。
  select progress.schema_version
  into resolved_schema_version
  from public.user_progress as progress
  where progress.user_id = resolved_user_id
  for update;
  resolved_schema_version := coalesce(resolved_schema_version, 1);

  reset_payload := jsonb_build_object(
    'schemaVersion', resolved_schema_version,
    'savedAt', reset_at,
    'resetAt', reset_at,
    'values', '{}'::jsonb,
    'meta', jsonb_build_object(
      'keys', '{}'::jsonb,
      'scopes', '{}'::jsonb,
      'resets', '{}'::jsonb,
      'resetAll', reset_at
    )
  );

  insert into public.user_progress as progress (
    user_id,
    schema_version,
    revision,
    payload,
    reset_at
  ) values (
    resolved_user_id,
    resolved_schema_version,
    1,
    reset_payload,
    reset_at
  )
  on conflict (user_id) do update
    set schema_version = greatest(progress.schema_version, excluded.schema_version),
        revision = progress.revision + 1,
        payload = jsonb_set(
          excluded.payload,
          '{schemaVersion}',
          to_jsonb(greatest(progress.schema_version, excluded.schema_version)),
          true
        ),
        reset_at = excluded.reset_at;

  -- 更新存档时触发器会先产生一份旧版本备份，所以必须在 upsert 后清除。
  delete from public.progress_backups
  where user_id = resolved_user_id;

  return reset_at;
end;
$$;

revoke all on function public.clear_player_progress(uuid) from public;
grant execute on function public.clear_player_progress(uuid) to authenticated;
