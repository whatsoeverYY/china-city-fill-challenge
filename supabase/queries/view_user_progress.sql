-- Supabase SQL Editor：查看玩家游戏进度（只读查询）。
-- 先执行 migrations/202608270003_admin_pagination_and_stats.sql。

-- 1. 分页查看所有玩家的轻量进度摘要；不会读取完整 payload。
select
  profile.email,
  profile.role,
  profile.last_seen_at,
  summary.completed_provinces,
  summary.placed_names,
  summary.completed_neighbor_challenges,
  summary.completed_levels,
  summary.mistakes,
  summary.progress_updated_at
from public.player_profiles as profile
left join public.user_progress_summaries as summary
  on summary.user_id = profile.id
order by profile.last_seen_at desc
limit 100 offset 0;

-- 2. 按邮箱查看某位玩家的完整云存档；替换目标邮箱。
select
  profile.email,
  progress.schema_version,
  progress.revision,
  progress.updated_at,
  progress.reset_at,
  jsonb_pretty(progress.payload) as payload
from public.player_profiles as profile
left join public.user_progress as progress
  on progress.user_id = profile.id
where lower(profile.email) = lower('<PLAYER_EMAIL>');

-- 3. 查看最近同步的 100 份存档及其摘要。
select
  profile.email,
  progress.schema_version,
  progress.revision,
  summary.completed_provinces,
  summary.completed_levels,
  summary.mistakes,
  progress.updated_at
from public.user_progress as progress
join public.player_profiles as profile
  on profile.id = progress.user_id
left join public.user_progress_summaries as summary
  on summary.user_id = progress.user_id
order by progress.updated_at desc
limit 100;
