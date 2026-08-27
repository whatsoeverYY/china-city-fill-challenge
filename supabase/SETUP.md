# Supabase 初始化

本项目使用 Supabase Auth、Postgres 和 RLS 保存玩家进度。前端只使用可公开的 publishable key，不需要也不应配置 `service_role` 或 secret key。

## 1. 创建数据表和权限策略

打开 Supabase Dashboard，进入 `SQL Editor → New query`，复制并执行：

`supabase/migrations/202608270001_player_accounts_and_progress.sql`

然后继续执行：

`supabase/migrations/202608270002_clear_player_progress.sql`

最后执行管理员分页、统计与存档版本保护迁移：

`supabase/migrations/202608270003_admin_pagination_and_stats.sql`

然后执行清除存档的版本兼容补丁：

`supabase/migrations/202608270004_clear_progress_schema_compatibility.sql`

迁移会创建：

- `player_profiles`：玩家邮箱、角色、注册时间和最近活跃时间；
- `user_progress`：每位玩家一份版本化 JSON 云存档；
- `progress_backups`：自动保留每位玩家最近 20 个旧版本；
- RLS：玩家只能读写自己的存档，管理员可以查看全部玩家和存档；
- `clear_player_progress`：玩家可清除自己的全部游戏记录，管理员可清除任意玩家记录，同时删除历史备份并阻止旧设备恢复已删存档。
- `admin_progress_summaries`：只暴露列表所需的轻量汇总，后台按页读取玩家，打开详情时才读取完整 JSON；
- 存档版本触发器：禁止旧客户端把更高版本云存档降级覆盖。

## 2. 配置邮箱登录

在 `Authentication → Providers → Email` 中启用 Email + Password。若保留“Confirm email”，玩家注册后需要先点击验证邮件。

在 `Authentication → URL Configuration` 中配置：

- Site URL：线上站点地址；
- Redirect URLs：线上站点地址、`http://localhost:3000/**`。

GitHub Pages 地址为：

`https://whatsoeveryy.github.io/china-city-fill-challenge/**`

## 3. 创建首位管理员

先使用管理员邮箱在游戏中完成注册。然后在 SQL Editor 单独执行以下语句，并把占位符换成管理员邮箱：

```sql
update public.player_profiles
set role = 'admin'
where lower(email) = lower('<ADMIN_EMAIL>');
```

刷新游戏页面后，账户面板会出现“进入管理员后台”。管理员仍可像普通玩家一样游玩并保存自己的进度。

## 4. 查看完整数据

- 游戏内：管理员登录后点击账户面板中的入口（线上静态地址为 `/admin.html`）；
- Supabase Dashboard：`Table Editor → player_profiles / user_progress / progress_backups`；
- SQL Editor：可直接使用 `supabase/queries/view_user_progress.sql` 中的分页摘要、按邮箱查完整存档等只读查询；
- Auth 用户：`Authentication → Users`。

不要在浏览器或仓库中放入 Supabase secret/service-role key。所有管理员读取都通过登录用户 JWT 与 RLS 授权。
