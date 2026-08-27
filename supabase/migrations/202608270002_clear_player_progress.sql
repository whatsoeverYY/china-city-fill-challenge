-- 中国城市填充挑战：玩家与管理员安全清除游戏存档
-- 保留玩家账号，并用 resetAt 阻止其他设备上的旧离线进度重新写回。

alter table public.user_progress
  add column if not exists reset_at timestamptz;

create or replace function public.enforce_user_progress_reset_marker()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  payload_reset_at timestamptz;
begin
  if tg_op = 'UPDATE' and old.reset_at is not null and (
    new.reset_at is null or new.reset_at < old.reset_at
  ) then
    new.reset_at := old.reset_at;
  end if;

  if new.reset_at is null then
    return new;
  end if;

  begin
    payload_reset_at := (new.payload ->> 'resetAt')::timestamptz;
  exception when others then
    payload_reset_at := null;
  end;

  if payload_reset_at is null or payload_reset_at < new.reset_at then
    raise exception 'progress reset acknowledgement required'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_user_progress_reset_marker_before_write
  on public.user_progress;
create trigger enforce_user_progress_reset_marker_before_write
  before insert or update on public.user_progress
  for each row execute function public.enforce_user_progress_reset_marker();

create or replace function public.clear_player_progress(target_user_id uuid default null)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_id uuid := (select auth.uid());
  resolved_user_id uuid := coalesce(target_user_id, requester_id);
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

  reset_payload := jsonb_build_object(
    'schemaVersion', 1,
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
    1,
    1,
    reset_payload,
    reset_at
  )
  on conflict (user_id) do update
    set schema_version = 1,
        revision = progress.revision + 1,
        payload = excluded.payload,
        reset_at = excluded.reset_at;

  -- 更新存档时触发器会先产生一份旧版本备份，所以必须在 upsert 后清除。
  delete from public.progress_backups
  where user_id = resolved_user_id;

  return reset_at;
end;
$$;

revoke all on function public.clear_player_progress(uuid) from public;
revoke all on function public.enforce_user_progress_reset_marker() from public;
grant execute on function public.clear_player_progress(uuid) to authenticated;
