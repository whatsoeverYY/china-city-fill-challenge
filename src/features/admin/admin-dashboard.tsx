"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { appPath } from "@/shared/lib/app-path";
import { operationErrorMessage } from "@/shared/lib/error";
import {
  GAUNTLET_LEVEL_COUNT,
  activeGauntletCompletionCount,
} from "@/domain/game/gauntlet-levels";
import {
  usePlayerData,
  type PlayerProfile,
} from "@/features/player/player-data-context";
import { getSupabaseClient } from "@/infrastructure/supabase/client";

type AdminProgressSummary = {
  user_id: string;
  schema_version: number;
  revision: number;
  updated_at: string;
  reset_at: string | null;
  completed_provinces: number;
  partial_provinces: number;
  placed_names: number;
  completed_neighbor_challenges: number;
  completed_level_ids: unknown;
  completed_levels: number;
  mistakes: number;
};

type AdminProgressDetail = {
  user_id: string;
  schema_version: number;
  revision: number;
  payload: unknown;
  updated_at: string;
};

type PlayerRow = PlayerProfile & {
  progress: AdminProgressSummary | null;
};

type DashboardStats = {
  total: number;
  withSave: number;
  activeSevenDays: number;
  passedLevels: number;
};

const PAGE_SIZE = 30;
const EMPTY_STATS: DashboardStats = {
  total: 0,
  withSave: 0,
  activeSevenDays: 0,
  passedLevels: 0,
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeStats(value: unknown): DashboardStats {
  if (!value || typeof value !== "object") return EMPTY_STATS;
  const record = value as Record<string, unknown>;
  const numberValue = (key: string) => {
    const parsed = Number(record[key]);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };
  return {
    total: numberValue("total"),
    withSave: numberValue("withSave"),
    activeSevenDays: numberValue("activeSevenDays"),
    passedLevels: numberValue("passedLevels"),
  };
}

function currentCompletedLevelCount(summary: AdminProgressSummary | null) {
  const levelIds = Array.isArray(summary?.completed_level_ids)
    ? summary.completed_level_ids.filter(
        (levelId): levelId is string => typeof levelId === "string",
      )
    : [];
  return activeGauntletCompletionCount(levelIds);
}

export default function AdminDashboard() {
  const { initialized, identity, isAdmin, offlineIdentity } = usePlayerData();
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "player" | "admin">("all");
  const [page, setPage] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [dashboardStats, setDashboardStats] = useState(EMPTY_STATS);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRow | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<AdminProgressDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlayerRow | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const loadSequenceRef = useRef(0);
  const detailSequenceRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const loadPlayers = useCallback(async () => {
    if (!isAdmin || offlineIdentity) return;
    const sequence = ++loadSequenceRef.current;
    setLoading(true);
    setError("");
    const supabase = getSupabaseClient();
    try {
      let profilesQuery = supabase
        .from("player_profiles")
        .select("id,email,role,created_at,last_seen_at,updated_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (roleFilter !== "all") profilesQuery = profilesQuery.eq("role", roleFilter);
      if (debouncedQuery) {
        profilesQuery = isUuid(debouncedQuery)
          ? profilesQuery.eq("id", debouncedQuery)
          : profilesQuery.ilike(
              "email",
              `%${debouncedQuery.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`,
            );
      }

      const [profilesResult, statsResult] = await Promise.all([
        profilesQuery,
        supabase.rpc("get_admin_dashboard_stats"),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (statsResult.error) throw statsResult.error;

      const profiles = (profilesResult.data ?? []) as PlayerProfile[];
      const playerIds = profiles.map((profile) => profile.id);
      const progressResult = playerIds.length
        ? await supabase
            .from("admin_progress_summaries")
            .select("user_id,schema_version,revision,updated_at,reset_at,completed_provinces,partial_provinces,placed_names,completed_neighbor_challenges,completed_level_ids,completed_levels,mistakes")
            .in("user_id", playerIds)
        : { data: [], error: null };
      if (progressResult.error) throw progressResult.error;

      const progressByUser = new Map(
        ((progressResult.data ?? []) as AdminProgressSummary[]).map((row) => [row.user_id, row]),
      );
      if (sequence !== loadSequenceRef.current) return;
      setPlayers(
        profiles.map((profile) => ({
          ...profile,
          progress: progressByUser.get(profile.id) ?? null,
        })),
      );
      setTotalPlayers(profilesResult.count ?? 0);
      setDashboardStats(normalizeStats(statsResult.data));
    } catch (caught) {
      if (sequence !== loadSequenceRef.current) return;
      const message = operationErrorMessage(caught, "无法读取玩家数据");
      setError(
        message.includes("schema cache") ||
        message.includes("admin_progress_summaries") ||
        message.includes("get_admin_dashboard_stats")
          ? "管理员分页与统计尚未初始化，请先在 Supabase 执行最新迁移。"
          : message,
      );
    } finally {
      if (sequence === loadSequenceRef.current) setLoading(false);
    }
  }, [debouncedQuery, isAdmin, offlineIdentity, page, roleFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPlayers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadPlayers]);

  const openPlayerDetails = async (player: PlayerRow) => {
    const sequence = ++detailSequenceRef.current;
    setSelectedPlayer(player);
    setSelectedProgress(null);
    setDeleteTarget(null);
    setDetailLoading(Boolean(player.progress));
    if (!player.progress) return;
    setError("");
    try {
      const { data, error: detailError } = await getSupabaseClient()
        .from("user_progress")
        .select("user_id,schema_version,revision,payload,updated_at")
        .eq("user_id", player.id)
        .maybeSingle<AdminProgressDetail>();
      if (detailError) throw detailError;
      if (sequence === detailSequenceRef.current) setSelectedProgress(data);
    } catch (caught) {
      if (sequence === detailSequenceRef.current) {
        setError(operationErrorMessage(caught, "无法读取玩家完整存档"));
      }
    } finally {
      if (sequence === detailSequenceRef.current) setDetailLoading(false);
    }
  };

  const clearPlayerProgress = async (player: PlayerRow) => {
    setDeletingUserId(player.id);
    setError("");
    setNotice("");
    try {
      const { error: clearError } = await getSupabaseClient().rpc(
        "clear_player_progress",
        { target_user_id: player.id },
      );
      if (clearError) throw clearError;
      setDeleteTarget(null);
      setSelectedPlayer(null);
      setSelectedProgress(null);
      detailSequenceRef.current += 1;
      setNotice(`${player.email} 的全部游戏记录已清除，玩家账号仍然保留。`);
      await loadPlayers();
    } catch (caught) {
      const message = operationErrorMessage(caught, "无法清除玩家存档");
      setError(
        message.includes("clear_player_progress") || message.includes("schema cache")
          ? "删档功能尚未初始化，请先在 Supabase 执行最新迁移。"
          : message,
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  if (!initialized) {
    return <main className="admin-state-page grid min-h-dvh place-content-center justify-items-center p-7 text-center"><strong>正在确认管理员身份…</strong></main>;
  }
  if (!identity) {
    return (
      <main className="admin-state-page grid min-h-dvh place-content-center justify-items-center p-7 text-center">
        <span className="admin-state-mark grid size-16 place-items-center rounded-[20px_20px_20px_5px] bg-brand-red text-xl font-black text-white" aria-hidden="true">锁</span>
        <h1 className="mb-2 mt-3.5 text-[clamp(28px,6vw,48px)] font-black">请先登录管理员账号</h1>
        <p className="mb-5 max-w-lg text-xs leading-6 text-ink-soft">回到游戏首页，点击右下角“登录保存”完成登录。</p>
        <a className="rounded-xl bg-brand-green px-4 py-2.5 text-[11px] font-extrabold text-white no-underline" href={appPath("/")}>返回游戏首页</a>
      </main>
    );
  }
  if (!isAdmin) {
    return (
      <main className="admin-state-page grid min-h-dvh place-content-center justify-items-center p-7 text-center">
        <span className="admin-state-mark grid size-16 place-items-center rounded-[20px_20px_20px_5px] bg-brand-red text-xl font-black text-white" aria-hidden="true">止</span>
        <h1 className="mb-2 mt-3.5 text-[clamp(28px,6vw,48px)] font-black">当前账号没有管理员权限</h1>
        <p className="mb-5 max-w-lg text-xs leading-6 text-ink-soft">{identity.email} 可以正常游戏，但不能查看其他玩家数据。</p>
        <a className="rounded-xl bg-brand-green px-4 py-2.5 text-[11px] font-extrabold text-white no-underline" href={appPath("/")}>继续游戏</a>
      </main>
    );
  }
  if (offlineIdentity) {
    return (
      <main className="admin-state-page grid min-h-dvh place-content-center justify-items-center p-7 text-center">
        <span className="admin-state-mark grid size-16 place-items-center rounded-[20px_20px_20px_5px] bg-brand-red text-xl font-black text-white" aria-hidden="true">离</span>
        <h1 className="mb-2 mt-3.5 text-[clamp(28px,6vw,48px)] font-black">管理员后台需要联网</h1>
        <p className="mb-5 max-w-lg text-xs leading-6 text-ink-soft">游戏仍可离线继续；连接网络后刷新此页面即可查看玩家数据。</p>
        <a className="rounded-xl bg-brand-green px-4 py-2.5 text-[11px] font-extrabold text-white no-underline" href={appPath("/")}>返回离线游戏</a>
      </main>
    );
  }

  const pageCount = Math.max(1, Math.ceil(totalPlayers / PAGE_SIZE));

  return (
    <main className="admin-shell mx-auto min-h-dvh w-[min(1460px,calc(100%_-_48px))] pb-16 pt-8 text-ink max-sm:w-[calc(100%_-_24px)] max-sm:pt-4">
      <header className="admin-header flex items-end justify-between gap-7 border-b border-black/10 pb-7 pt-3 max-lg:flex-col max-lg:items-stretch">
        <div>
          <p className="eyebrow m-0 text-xs font-black tracking-[0.16em] text-brand-red">ADMIN CONSOLE</p>
          <h1 className="mb-2 mt-0 text-[clamp(32px,5vw,58px)] font-black leading-none">玩家与进度中心</h1>
          <p className="mb-0 text-xs text-ink-soft">查看玩家账号、活跃时间、地图完成度、闯关进度与完整云存档。</p>
        </div>
        <div className="admin-header-actions flex gap-2.5 max-sm:grid max-sm:grid-cols-1">
          <a className="grid min-h-11 place-items-center rounded-xl border border-black/15 bg-card px-3.5 text-[11px] font-extrabold no-underline" href={appPath("/")}>← 返回游戏</a>
          <button className="min-h-11 cursor-pointer rounded-xl border border-black/15 bg-card px-3.5 text-[11px] font-extrabold" type="button" onClick={() => void loadPlayers()} disabled={loading}>
            {loading ? "刷新中…" : "刷新数据"}
          </button>
        </div>
      </header>

      <section className="admin-stat-grid my-6 grid grid-cols-4 gap-3.5 max-lg:grid-cols-2 [&_article]:min-h-36 [&_article]:rounded-[16px_16px_16px_5px] [&_article]:border [&_article]:border-black/10 [&_article]:bg-card/90 [&_article]:p-5 [&_article]:shadow-sm max-sm:[&_article]:min-h-28 max-sm:[&_article]:p-3.5 [&_small]:block [&_small]:text-[9px] [&_small]:text-ink-soft [&_span]:block [&_span]:text-[10px] [&_span]:font-black [&_span]:tracking-[0.08em] [&_span]:text-ink-soft [&_strong]:my-2 [&_strong]:block [&_strong]:text-[42px] [&_strong]:text-brand-green-dark max-sm:[&_strong]:text-3xl" aria-label="玩家统计">
        <article><span>全部玩家</span><strong>{dashboardStats.total}</strong><small>含管理员账号</small></article>
        <article><span>已有云存档</span><strong>{dashboardStats.withSave}</strong><small>至少同步过一次</small></article>
        <article><span>近 7 日活跃</span><strong>{dashboardStats.activeSevenDays}</strong><small>按最近访问时间</small></article>
        <article><span>累计通关</span><strong>{dashboardStats.passedLevels}</strong><small>所有玩家历史通关记录</small></article>
      </section>

      <section className="admin-player-panel overflow-hidden rounded-[20px_20px_20px_7px] border border-black/10 bg-card shadow-lg">
        <div className="admin-panel-heading flex items-end justify-between gap-6 border-b border-black/10 p-5 max-lg:flex-col max-lg:items-stretch">
          <div>
            <p className="eyebrow m-0 text-xs font-black tracking-[0.16em] text-brand-red">PLAYER DIRECTORY</p>
            <h2 className="m-0 text-3xl font-black">玩家列表</h2>
          </div>
          <div className="admin-filters flex gap-2.5 max-lg:grid max-lg:grid-cols-2 max-sm:grid-cols-1">
            <label className="grid gap-1">
              <span className="text-[9px] font-extrabold text-ink-soft">搜索玩家</span>
              <input
                className="min-h-11 w-[min(260px,30vw)] rounded-xl border border-black/20 bg-white px-3 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 max-lg:w-full"
                type="search"
                value={query}
                placeholder="邮箱或完整用户 ID"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(0);
                }}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[9px] font-extrabold text-ink-soft">账号角色</span>
              <select
                className="min-h-11 rounded-xl border border-black/20 bg-white px-3 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15"
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value as typeof roleFilter);
                  setPage(0);
                }}
              >
                <option value="all">全部角色</option>
                <option value="player">普通玩家</option>
                <option value="admin">管理员</option>
              </select>
            </label>
          </div>
        </div>

        {notice ? <div className="admin-notice m-5 rounded-xl bg-brand-green/10 p-3.5 text-[11px] text-brand-green-dark" role="status">{notice}</div> : null}
        {error ? <div className="admin-error m-5 rounded-xl bg-brand-red/10 p-3.5 text-[11px] text-brand-red-dark" role="alert">{error}</div> : null}
        <div className="admin-table-wrap overflow-x-auto" aria-busy={loading}>
          <table className="admin-player-table w-full min-w-[1040px] border-collapse text-left [&_td]:border-b [&_td]:border-black/10 [&_td]:p-4 [&_td]:align-middle [&_td]:text-[11px] [&_th]:border-b [&_th]:border-black/10 [&_th]:bg-paper-deep/40 [&_th]:px-4 [&_th]:py-3 [&_th]:text-[9px] [&_th]:font-black [&_th]:tracking-wider [&_th]:text-ink-soft">
            <thead>
              <tr><th>玩家</th><th>角色</th><th>全国地图</th><th>闯关进度</th><th>最近活跃</th><th>云存档</th></tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const summary = player.progress;
                return (
                  <tr key={player.id}>
                    <td data-label="玩家"><strong className="block max-w-[270px] overflow-hidden text-ellipsis whitespace-nowrap">{player.email}</strong><small className="mt-1 block max-w-[270px] overflow-hidden text-ellipsis whitespace-nowrap text-[8px] text-ink-soft">{player.id}</small></td>
                    <td data-label="角色"><span className={`admin-role admin-role--${player.role} inline-flex rounded-full px-2 py-1 text-[9px] font-extrabold ${player.role === "admin" ? "bg-brand-gold/20 text-[#745719]" : "bg-brand-green/10 text-brand-green-dark"}`}>{player.role === "admin" ? "管理员" : "玩家"}</span></td>
                    <td data-label="全国地图"><strong className="block">{summary?.completed_provinces ?? 0}<i className="text-[9px] not-italic text-ink-soft">/34</i></strong><small className="mt-1 block text-[8px] text-ink-soft">{summary?.placed_names ?? 0} 个名称已归位</small></td>
                    <td data-label="闯关进度"><strong className="block">{currentCompletedLevelCount(summary)}<i className="text-[9px] not-italic text-ink-soft">/{GAUNTLET_LEVEL_COUNT}</i></strong><small className="mt-1 block text-[8px] text-ink-soft">{summary?.mistakes ?? 0} 道待复习错题</small></td>
                    <td data-label="最近活跃"><strong className="block">{formatDate(player.last_seen_at)}</strong><small className="mt-1 block text-[8px] text-ink-soft">注册于 {formatDate(player.created_at)}</small></td>
                    <td data-label="云存档">
                      <button className="min-h-9 cursor-pointer rounded-lg border border-brand-green/25 bg-brand-green/10 px-2.5 text-[10px] font-extrabold text-brand-green-dark" type="button" onClick={() => void openPlayerDetails(player)}>
                        {player.progress ? "查看 / 管理" : "管理存档"}
                      </button>
                      {!player.progress ? <span className="admin-no-save ml-2 text-[9px] text-ink-soft">尚未同步</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && players.length === 0 ? <div className="admin-empty m-5 rounded-xl bg-paper p-3.5 text-center text-[11px] text-ink-soft">没有符合当前筛选条件的玩家。</div> : null}
        </div>
        <nav className="admin-pagination flex items-center justify-between gap-3 border-t border-black/10 px-5 py-3.5 text-[10px] text-ink-soft max-sm:flex-col max-sm:items-stretch" aria-label="玩家列表分页">
          <span>共 {totalPlayers} 位 · 第 {page + 1}/{pageCount} 页</span>
          <div className="flex gap-2 max-sm:grid max-sm:grid-cols-2">
            <button className="min-h-9 cursor-pointer rounded-lg border border-brand-green/20 bg-brand-green/5 px-3 text-[10px] font-extrabold text-brand-green-dark disabled:cursor-not-allowed disabled:opacity-40" type="button" disabled={loading || page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>上一页</button>
            <button className="min-h-9 cursor-pointer rounded-lg border border-brand-green/20 bg-brand-green/5 px-3 text-[10px] font-extrabold text-brand-green-dark disabled:cursor-not-allowed disabled:opacity-40" type="button" disabled={loading || page + 1 >= pageCount} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>下一页</button>
          </div>
        </nav>
      </section>

      {selectedPlayer ? (
        <div className="admin-detail-backdrop fixed inset-0 z-[1600] grid place-items-center bg-[#141c178f] p-5 backdrop-blur-md" role="presentation">
          <section className="admin-detail-dialog relative max-h-[calc(100dvh_-_44px)] w-full max-w-[760px] overflow-auto rounded-[22px_22px_22px_7px] bg-card p-8 shadow-2xl max-sm:p-5" role="dialog" aria-modal="true" aria-labelledby="admin-detail-title">
            <button className="dialog-close absolute right-4 top-4 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-black/5 text-xl" type="button" aria-label="关闭玩家详情" onClick={() => {
              detailSequenceRef.current += 1;
              setSelectedPlayer(null);
              setSelectedProgress(null);
              setDeleteTarget(null);
            }}>×</button>
            <p className="eyebrow m-0 text-xs font-black tracking-[0.16em] text-brand-red">PLAYER DETAIL</p>
            <h2 className="mb-5 mt-0 break-words text-3xl font-black" id="admin-detail-title">{selectedPlayer.email}</h2>
            <div className="admin-detail-metrics grid grid-cols-4 gap-2 max-sm:grid-cols-2 [&>div]:rounded-xl [&>div]:bg-paper [&>div]:p-3 [&_span]:block [&_span]:text-[8px] [&_span]:text-ink-soft [&_strong]:mt-1 [&_strong]:block [&_strong]:text-xl [&_strong]:text-brand-green-dark">
              <div><span>完成省份</span><strong>{selectedPlayer.progress?.completed_provinces ?? 0}/34</strong></div>
              <div><span>进行中省份</span><strong>{selectedPlayer.progress?.partial_provinces ?? 0}</strong></div>
              <div><span>邻省连城</span><strong>{selectedPlayer.progress?.completed_neighbor_challenges ?? 0}/34</strong></div>
              <div><span>已过关卡</span><strong>{currentCompletedLevelCount(selectedPlayer.progress)}/{GAUNTLET_LEVEL_COUNT}</strong></div>
            </div>
            <dl className="admin-account-details my-4 grid gap-2 [&>div]:grid [&>div]:grid-cols-[90px_1fr] [&>div]:gap-3 [&>div]:border-b [&>div]:border-black/10 [&>div]:py-2 [&>div]:text-[10px] [&_dd]:m-0 [&_dd]:break-words [&_dt]:font-extrabold [&_dt]:text-ink-soft">
              <div><dt>用户 ID</dt><dd>{selectedPlayer.id}</dd></div>
              <div><dt>最近活跃</dt><dd>{formatDate(selectedPlayer.last_seen_at)}</dd></div>
              <div><dt>存档版本</dt><dd>{selectedPlayer.progress ? `schema ${selectedPlayer.progress.schema_version} · revision ${selectedPlayer.progress.revision}` : "尚无云存档"}</dd></div>
              <div><dt>最后同步</dt><dd>{formatDate(selectedPlayer.progress?.updated_at)}</dd></div>
              <div><dt>最近删档</dt><dd>{formatDate(selectedPlayer.progress?.reset_at)}</dd></div>
            </dl>
            {detailLoading ? <p className="admin-detail-loading text-[10px] text-ink-soft">正在按需载入完整存档…</p> : null}
            {selectedProgress ? (
              <details className="admin-json-details rounded-xl bg-[#202822] p-3 text-[#e5eee8]">
                <summary className="cursor-pointer text-[10px] font-extrabold">查看完整存档 JSON</summary>
                <pre className="mt-3.5 max-h-[340px] overflow-auto whitespace-pre-wrap break-all text-[9px] leading-4">{JSON.stringify(selectedProgress.payload, null, 2)}</pre>
              </details>
            ) : null}
            <button className="admin-delete-progress mt-3.5 min-h-10 w-full cursor-pointer rounded-lg border border-brand-red/25 bg-brand-red/5 px-2.5 text-[10px] font-black text-brand-red-dark disabled:cursor-wait disabled:opacity-60" type="button" onClick={() => setDeleteTarget(selectedPlayer)} disabled={deletingUserId !== null}>
              清除该玩家全部游戏记录
            </button>
            {deleteTarget?.id === selectedPlayer.id ? (
              <section className="admin-delete-confirm mt-3.5 rounded-xl border border-brand-red/20 bg-brand-red/5 p-3.5 text-brand-red-dark" role="alertdialog" aria-labelledby="admin-delete-confirm-title" aria-describedby="admin-delete-confirm-description">
                <strong className="block text-xs" id="admin-delete-confirm-title">再次确认清除 {selectedPlayer.email} 的存档</strong>
                <p className="my-2 text-[10px] leading-4" id="admin-delete-confirm-description">全国地图、邻省挑战、全部关卡、错题、答题历史和云端备份都会被清除。账号不会删除，此操作不可恢复。</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="min-h-10 cursor-pointer rounded-lg border border-black/15 bg-white text-[10px] font-black disabled:cursor-wait disabled:opacity-60" type="button" onClick={() => setDeleteTarget(null)} disabled={deletingUserId !== null}>取消</button>
                  <button type="button" className="is-danger min-h-10 cursor-pointer rounded-lg border border-brand-red-dark bg-brand-red-dark text-[10px] font-black text-white disabled:cursor-wait disabled:opacity-60" onClick={() => void clearPlayerProgress(selectedPlayer)} disabled={deletingUserId !== null}>
                    {deletingUserId === selectedPlayer.id ? "正在清除…" : "确认清除全部记录"}
                  </button>
                </div>
              </section>
            ) : null}
          </section>
        </div>
      ) : null}
    </main>
  );
}
