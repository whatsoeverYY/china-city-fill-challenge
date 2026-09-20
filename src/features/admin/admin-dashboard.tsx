"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { appPath } from "@/shared/lib/app-path";
import AppLink from "@/shared/components/app-link";
import { operationErrorMessage } from "@/shared/lib/error";
import {
  GAUNTLET_LEVEL_COUNT,
  activeGauntletCompletionCount,
} from "@/domain/game/gauntlet-levels";
import { PROVINCES } from "@/domain/geography/data/provinces";
import { usePlayerData } from "@/features/player/player-data-context";
import { useModalDialog } from "@/shared/hooks/use-modal-dialog";
import {
  EMPTY_DASHBOARD_STATS,
  type AdminPlayerRow,
  type AdminProgressDetail,
  type AdminProgressSummary,
} from "@/features/admin/model/admin-types";
import {
  clearAdminPlayerProgress,
  fetchAdminPlayerProgress,
  fetchAdminPlayers,
} from "@/features/admin/services/admin-player-service";

const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;
const INITIAL_LOAD_DEFER_MS = 0;
const TABLE_HEADER_CLASS = "border-b border-black/10 bg-paper-deep/40 px-4 py-3 text-meta font-black tracking-wider text-ink-soft";
const TABLE_CELL_CLASS = "border-b border-black/10 p-4 align-middle text-compact max-sm:flex max-sm:min-w-0 max-sm:flex-col max-sm:gap-1 max-sm:border-b-0 max-sm:p-3";
const MOBILE_CELL_LABEL_CLASS = "hidden text-meta font-black tracking-wider text-ink-soft max-sm:block";
const STAT_CARD_CLASS = "min-h-36 rounded-[16px_16px_16px_5px] border border-black/10 bg-card/90 p-5 shadow-sm max-sm:min-h-28 max-sm:p-3.5";

function AdminMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-paper p-3">
      <span className="block text-meta text-ink-soft">{label}</span>
      <strong className="mt-1 block text-xl text-jade-700">{value}</strong>
    </div>
  );
}

function AdminDetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3 border-b border-black/10 py-2 text-meta">
      <dt className="font-extrabold text-ink-soft">{label}</dt>
      <dd className="m-0 break-words">{value}</dd>
    </div>
  );
}

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
  const [players, setPlayers] = useState<AdminPlayerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "player" | "admin">("all");
  const [page, setPage] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [dashboardStats, setDashboardStats] = useState(EMPTY_DASHBOARD_STATS);
  const [selectedPlayer, setSelectedPlayer] = useState<AdminPlayerRow | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<AdminProgressDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminPlayerRow | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const loadSequenceRef = useRef(0);
  const detailSequenceRef = useRef(0);
  const closePlayerDetails = () => {
    detailSequenceRef.current += 1;
    setSelectedPlayer(null);
    setSelectedProgress(null);
    setDeleteTarget(null);
  };
  const detailDialogRef = useModalDialog(Boolean(selectedPlayer), () => {
    if (deleteTarget) setDeleteTarget(null);
    else closePlayerDetails();
  });

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [query]);

  const loadPlayers = useCallback(async () => {
    if (!isAdmin || offlineIdentity) return;
    const sequence = ++loadSequenceRef.current;
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminPlayers({
        page,
        pageSize: PAGE_SIZE,
        query: debouncedQuery,
        role: roleFilter,
      });
      if (sequence !== loadSequenceRef.current) return;
      setPlayers(result.players);
      setTotalPlayers(result.totalPlayers);
      setDashboardStats(result.stats);
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
    const timer = window.setTimeout(() => void loadPlayers(), INITIAL_LOAD_DEFER_MS);
    return () => window.clearTimeout(timer);
  }, [loadPlayers]);

  const openPlayerDetails = async (player: AdminPlayerRow) => {
    const sequence = ++detailSequenceRef.current;
    setSelectedPlayer(player);
    setSelectedProgress(null);
    setDeleteTarget(null);
    setDetailLoading(Boolean(player.progress));
    if (!player.progress) return;
    setError("");
    try {
      const data = await fetchAdminPlayerProgress(player.id);
      if (sequence === detailSequenceRef.current) setSelectedProgress(data);
    } catch (caught) {
      if (sequence === detailSequenceRef.current) {
        setError(operationErrorMessage(caught, "无法读取玩家完整存档"));
      }
    } finally {
      if (sequence === detailSequenceRef.current) setDetailLoading(false);
    }
  };

  const clearPlayerProgress = async (player: AdminPlayerRow) => {
    setDeletingUserId(player.id);
    setError("");
    setNotice("");
    try {
      await clearAdminPlayerProgress(player.id);
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
        <span className="admin-state-mark grid size-16 place-items-center rounded-[20px_20px_20px_5px] bg-city-500 font-serif text-xl font-black text-white" aria-hidden="true">锁</span>
        <h1 className="mb-2 mt-3.5 font-serif text-page font-bold max-md:text-page-mobile">请先登录管理员账号</h1>
        <p className="mb-5 max-w-lg text-xs leading-6 text-ink-soft">回到游戏首页，点击右下角“登录保存”完成登录。</p>
        <AppLink className="inline-flex min-h-10 items-center justify-center rounded-xl bg-jade-500 px-4 py-2.5 text-compact font-extrabold text-white no-underline max-sm:min-h-11" href={appPath("/")}>返回游戏首页</AppLink>
      </main>
    );
  }
  if (!isAdmin) {
    return (
      <main className="admin-state-page grid min-h-dvh place-content-center justify-items-center p-7 text-center">
        <span className="admin-state-mark grid size-16 place-items-center rounded-[20px_20px_20px_5px] bg-city-500 font-serif text-xl font-black text-white" aria-hidden="true">止</span>
        <h1 className="mb-2 mt-3.5 font-serif text-page font-bold max-md:text-page-mobile">当前账号没有管理员权限</h1>
        <p className="mb-5 max-w-lg text-xs leading-6 text-ink-soft">{identity.email} 可以正常游戏，但不能查看其他玩家数据。</p>
        <AppLink className="inline-flex min-h-10 items-center justify-center rounded-xl bg-jade-500 px-4 py-2.5 text-compact font-extrabold text-white no-underline max-sm:min-h-11" href={appPath("/")}>继续游戏</AppLink>
      </main>
    );
  }
  if (offlineIdentity) {
    return (
      <main className="admin-state-page grid min-h-dvh place-content-center justify-items-center p-7 text-center">
        <span className="admin-state-mark grid size-16 place-items-center rounded-[20px_20px_20px_5px] bg-city-500 font-serif text-xl font-black text-white" aria-hidden="true">离</span>
        <h1 className="mb-2 mt-3.5 font-serif text-page font-bold max-md:text-page-mobile">管理员后台需要联网</h1>
        <p className="mb-5 max-w-lg text-xs leading-6 text-ink-soft">当前已打开的游戏页面仍可继续操作；重新打开或切换页面可能需要网络。连接网络后刷新此页面即可查看玩家数据。</p>
        <AppLink className="inline-flex min-h-10 items-center justify-center rounded-xl bg-jade-500 px-4 py-2.5 text-compact font-extrabold text-white no-underline max-sm:min-h-11" href={appPath("/")}>返回游戏首页</AppLink>
      </main>
    );
  }

  const pageCount = Math.max(1, Math.ceil(totalPlayers / PAGE_SIZE));

  return (
    <main className="admin-shell mx-auto min-h-dvh w-[min(1460px,calc(100%_-_48px))] pb-16 pt-8 text-ink max-sm:w-[calc(100%_-_24px)] max-sm:pt-4">
      <header className="admin-header flex items-end justify-between gap-7 border-b border-black/10 pb-7 pt-3 max-lg:flex-col max-lg:items-stretch">
        <div>
          <p className="eyebrow m-0 text-xs font-black tracking-[0.16em] text-city-500">ADMIN CONSOLE</p>
          <h1 className="mb-2 mt-0 font-serif text-page font-bold max-md:text-page-mobile">玩家与进度中心</h1>
          <p className="mb-0 text-compact text-ink-soft">查看玩家账号、活跃时间、地图完成度、闯关进度与完整云存档。</p>
        </div>
        <div className="admin-header-actions flex gap-2.5 max-sm:grid max-sm:grid-cols-2">
          <AppLink className="grid min-h-11 place-items-center rounded-xl border border-black/15 bg-card px-3.5 py-2 text-compact font-extrabold no-underline" href={appPath("/")}>← 返回游戏</AppLink>
          <button className="min-h-11 cursor-pointer rounded-xl border border-black/15 bg-card px-3.5 py-2 text-compact font-extrabold" type="button" onClick={() => void loadPlayers()} disabled={loading}>
            {loading ? "刷新中…" : "刷新数据"}
          </button>
        </div>
      </header>

      <section className="admin-stat-grid my-6 grid grid-cols-4 gap-3.5 max-lg:grid-cols-2" aria-label="玩家统计">
        {[
          ["全部玩家", dashboardStats.total, "含管理员账号"],
          ["已有云存档", dashboardStats.withSave, "至少同步过一次"],
          ["近 7 日活跃", dashboardStats.activeSevenDays, "按最近访问时间"],
          ["累计通关", dashboardStats.passedLevels, "所有玩家历史通关记录"],
        ].map(([label, value, note]) => (
          <article className={STAT_CARD_CLASS} key={label}>
            <span className="block text-[10px] font-black tracking-[0.08em] text-ink-soft">{label}</span>
            <strong className="my-2 block font-serif text-[42px] text-jade-700 max-md:text-3xl">{value}</strong>
            <small className="block text-meta text-ink-soft">{note}</small>
          </article>
        ))}
      </section>

      <section className="admin-player-panel overflow-hidden rounded-[20px_20px_20px_7px] border border-black/10 bg-card shadow-lg">
        <div className="admin-panel-heading flex items-end justify-between gap-6 border-b border-black/10 p-5 max-lg:flex-col max-lg:items-stretch">
          <div>
            <p className="eyebrow m-0 text-xs font-black tracking-[0.16em] text-city-500">PLAYER DIRECTORY</p>
            <h2 className="m-0 font-serif text-section max-sm:text-section-mobile">玩家列表</h2>
          </div>
          <div className="admin-filters flex gap-2.5 max-lg:grid max-lg:grid-cols-2 max-sm:grid-cols-1">
            <label className="grid gap-1">
              <span className="text-meta font-extrabold text-ink-soft">搜索玩家</span>
              <input
                className="min-h-11 w-[min(260px,30vw)] rounded-xl border border-black/20 bg-white px-3 outline-none focus:border-jade-500 focus:ring-2 focus:ring-jade-500/15 max-lg:w-full"
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
              <span className="text-meta font-extrabold text-ink-soft">账号角色</span>
              <select
                className="min-h-11 rounded-xl border border-black/20 bg-white px-3 outline-none focus:border-jade-500 focus:ring-2 focus:ring-jade-500/15"
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

        {notice ? <div className="admin-notice m-5 rounded-xl bg-jade-500/10 p-3.5 text-[11px] text-jade-700" role="status">{notice}</div> : null}
        {error ? <div className="admin-error m-5 rounded-xl bg-city-500/10 p-3.5 text-[11px] text-city-900" role="alert">{error}</div> : null}
        <div className="admin-table-wrap overflow-x-auto max-sm:overflow-visible" aria-busy={loading}>
          <table className="admin-player-table w-full min-w-[1040px] border-collapse text-left max-sm:block max-sm:min-w-0">
            <thead className="max-sm:hidden">
              <tr><th className={TABLE_HEADER_CLASS}>玩家</th><th className={TABLE_HEADER_CLASS}>角色</th><th className={TABLE_HEADER_CLASS}>全国地图</th><th className={TABLE_HEADER_CLASS}>闯关进度</th><th className={TABLE_HEADER_CLASS}>最近活跃</th><th className={TABLE_HEADER_CLASS}>云存档</th></tr>
            </thead>
            <tbody className="max-sm:grid max-sm:gap-3 max-sm:p-3">
              {players.map((player) => {
                const summary = player.progress;
                return (
                  <tr className="max-sm:grid max-sm:grid-cols-2 max-sm:overflow-hidden max-sm:rounded-xl max-sm:border max-sm:border-black/10 max-sm:bg-white/55" key={player.id}>
                    <td className={`${TABLE_CELL_CLASS} max-sm:col-span-2`} data-label="玩家"><span className={MOBILE_CELL_LABEL_CLASS}>玩家</span><strong className="block max-w-[270px] overflow-hidden text-ellipsis whitespace-nowrap">{player.email}</strong><small className="mt-1 block max-w-[270px] overflow-hidden text-ellipsis whitespace-nowrap text-meta text-ink-soft">{player.id}</small></td>
                    <td className={TABLE_CELL_CLASS} data-label="角色"><span className={MOBILE_CELL_LABEL_CLASS}>角色</span><span className={`admin-role inline-flex w-fit rounded-full px-2 py-1 text-meta font-extrabold ${player.role === "admin" ? "bg-gold-500/20 text-gold-900" : "bg-jade-500/10 text-jade-700"}`}>{player.role === "admin" ? "管理员" : "玩家"}</span></td>
                    <td className={TABLE_CELL_CLASS} data-label="全国地图"><span className={MOBILE_CELL_LABEL_CLASS}>全国地图</span><strong className="block">{summary?.completed_provinces ?? 0}<i className="text-meta not-italic text-ink-soft">/{PROVINCES.length}</i></strong><small className="mt-1 block text-meta text-ink-soft">{summary?.placed_names ?? 0} 个名称已归位</small></td>
                    <td className={TABLE_CELL_CLASS} data-label="闯关进度"><span className={MOBILE_CELL_LABEL_CLASS}>闯关进度</span><strong className="block">{currentCompletedLevelCount(summary)}<i className="text-meta not-italic text-ink-soft">/{GAUNTLET_LEVEL_COUNT}</i></strong><small className="mt-1 block text-meta text-ink-soft">{summary?.mistakes ?? 0} 道待复习错题</small></td>
                    <td className={TABLE_CELL_CLASS} data-label="最近活跃"><span className={MOBILE_CELL_LABEL_CLASS}>最近活跃</span><strong className="block">{formatDate(player.last_seen_at)}</strong><small className="mt-1 block text-meta text-ink-soft">注册于 {formatDate(player.created_at)}</small></td>
                    <td className={`${TABLE_CELL_CLASS} max-sm:col-span-2 max-sm:border-t max-sm:border-black/10`} data-label="云存档">
                      <span className={MOBILE_CELL_LABEL_CLASS}>云存档</span>
                      <button className="min-h-9 cursor-pointer rounded-lg border border-jade-500/25 bg-jade-500/10 px-2.5 py-2 text-compact font-extrabold text-jade-700 max-sm:min-h-11" type="button" onClick={() => void openPlayerDetails(player)}>
                        {player.progress ? "查看 / 管理" : "管理存档"}
                      </button>
                      {!player.progress ? <span className="admin-no-save ml-2 text-meta text-ink-soft">尚未同步</span> : null}
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
            <button className="min-h-9 cursor-pointer rounded-lg border border-jade-500/20 bg-jade-500/5 px-3 py-2 text-compact font-extrabold text-jade-700 disabled:cursor-not-allowed disabled:opacity-40 max-sm:min-h-11" type="button" disabled={loading || page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>上一页</button>
            <button className="min-h-9 cursor-pointer rounded-lg border border-jade-500/20 bg-jade-500/5 px-3 py-2 text-compact font-extrabold text-jade-700 disabled:cursor-not-allowed disabled:opacity-40 max-sm:min-h-11" type="button" disabled={loading || page + 1 >= pageCount} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>下一页</button>
          </div>
        </nav>
      </section>

      {selectedPlayer ? (
        <div className="admin-detail-backdrop fixed inset-0 z-[1600] grid place-items-center bg-ink-900/55 p-5 backdrop-blur-md" role="presentation">
          <section ref={detailDialogRef} tabIndex={-1} className="admin-detail-dialog relative max-h-[calc(100dvh_-_44px)] w-full max-w-[760px] overflow-auto rounded-[22px_22px_22px_7px] bg-card p-8 shadow-2xl max-sm:p-5" role="dialog" aria-modal="true" aria-labelledby="admin-detail-title">
            <button className="dialog-close absolute right-4 top-4 grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-black/5 text-xl" type="button" aria-label="关闭玩家详情" onClick={closePlayerDetails}>×</button>
            <p className="eyebrow m-0 text-xs font-black tracking-[0.16em] text-city-500">PLAYER DETAIL</p>
            <h2 className="mb-5 mt-0 break-words font-serif text-section font-bold max-sm:text-section-mobile" id="admin-detail-title">{selectedPlayer.email}</h2>
            <div className="admin-detail-metrics grid grid-cols-4 gap-2 max-sm:grid-cols-2">
              <AdminMetric label="完成省份" value={`${selectedPlayer.progress?.completed_provinces ?? 0}/${PROVINCES.length}`} />
              <AdminMetric label="进行中省份" value={selectedPlayer.progress?.partial_provinces ?? 0} />
              <AdminMetric label="邻省连城" value={`${selectedPlayer.progress?.completed_neighbor_challenges ?? 0}/${PROVINCES.length}`} />
              <AdminMetric label="已过关卡" value={`${currentCompletedLevelCount(selectedPlayer.progress)}/${GAUNTLET_LEVEL_COUNT}`} />
            </div>
            <dl className="admin-account-details my-4 grid gap-2">
              <AdminDetailRow label="用户 ID" value={selectedPlayer.id} />
              <AdminDetailRow label="最近活跃" value={formatDate(selectedPlayer.last_seen_at)} />
              <AdminDetailRow label="存档版本" value={selectedPlayer.progress ? `schema ${selectedPlayer.progress.schema_version} · revision ${selectedPlayer.progress.revision}` : "尚无云存档"} />
              <AdminDetailRow label="最后同步" value={formatDate(selectedPlayer.progress?.updated_at)} />
              <AdminDetailRow label="最近删档" value={formatDate(selectedPlayer.progress?.reset_at)} />
            </dl>
            {detailLoading ? <p className="admin-detail-loading text-[10px] text-ink-soft">正在按需载入完整存档…</p> : null}
            {selectedProgress ? (
              <details className="admin-json-details rounded-xl bg-stone-900 p-3 text-ink-200">
                <summary className="cursor-pointer text-[10px] font-extrabold">查看完整存档 JSON</summary>
                <pre className="mt-3.5 max-h-[340px] overflow-auto whitespace-pre-wrap break-all text-meta leading-4">{JSON.stringify(selectedProgress.payload, null, 2)}</pre>
              </details>
            ) : null}
            <button className="admin-delete-progress mt-3.5 min-h-10 w-full cursor-pointer rounded-lg border border-city-500/25 bg-city-500/5 px-2.5 py-2 text-compact font-black text-city-900 disabled:cursor-wait disabled:opacity-60 max-sm:min-h-11" type="button" onClick={() => setDeleteTarget(selectedPlayer)} disabled={deletingUserId !== null}>
              清除该玩家全部游戏记录
            </button>
            {deleteTarget?.id === selectedPlayer.id ? (
              <section className="admin-delete-confirm mt-3.5 rounded-xl border border-city-500/20 bg-city-500/5 p-3.5 text-city-900" role="alertdialog" aria-labelledby="admin-delete-confirm-title" aria-describedby="admin-delete-confirm-description">
                <strong className="block text-xs" id="admin-delete-confirm-title">再次确认清除 {selectedPlayer.email} 的存档</strong>
                <p className="my-2 text-[10px] leading-4" id="admin-delete-confirm-description">全国地图、邻省挑战、全部关卡、错题、答题历史和云端备份都会被清除。账号不会删除，此操作不可恢复。</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="min-h-10 cursor-pointer rounded-lg border border-black/15 bg-white px-3 py-2 text-compact font-black disabled:cursor-wait disabled:opacity-60 max-sm:min-h-11" type="button" onClick={() => setDeleteTarget(null)} disabled={deletingUserId !== null}>取消</button>
                  <button type="button" className="min-h-10 cursor-pointer rounded-lg border border-city-900 bg-city-900 px-3 py-2 text-compact font-black text-white disabled:cursor-wait disabled:opacity-60 max-sm:min-h-11" onClick={() => void clearPlayerProgress(selectedPlayer)} disabled={deletingUserId !== null}>
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
