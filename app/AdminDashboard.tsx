"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { appPath } from "./app-path";
import {
  GAUNTLET_MISTAKES_KEY,
  GAUNTLET_PROGRESS_KEY,
  NEIGHBOR_PROGRESS_KEY,
  STORAGE_KEY,
  normalizeProgressSnapshot,
} from "./progress-storage";
import { usePlayerData, type PlayerProfile } from "./PlayerDataProvider";
import { getSupabaseClient } from "./supabase-client";

type AdminProgressRow = {
  user_id: string;
  schema_version: number;
  revision: number;
  payload: unknown;
  updated_at: string;
};

type PlayerRow = PlayerProfile & {
  progress: AdminProgressRow | null;
};

type ProgressSummary = {
  completedProvinces: number;
  partialProvinces: number;
  placedNames: number;
  completedNeighborChallenges: number;
  completedLevels: number;
  mistakes: number;
};

function parseArray(raw: string | undefined) {
  if (!raw) return [] as unknown[];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function parseProgressMap(raw: string | undefined) {
  if (!raw) return {} as Record<string, string[]>;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, string[]] =>
          Array.isArray(entry[1]) && entry[1].every((item) => typeof item === "string"),
      ),
    );
  } catch {
    return {};
  }
}

function summarizeProgress(payload: unknown): ProgressSummary {
  const snapshot = normalizeProgressSnapshot(payload);
  const mapProgress = parseProgressMap(snapshot.values[STORAGE_KEY]);
  const neighborProgress = parseProgressMap(snapshot.values[NEIGHBOR_PROGRESS_KEY]);
  const mapEntries = Object.values(mapProgress);
  return {
    completedProvinces: mapEntries.filter((names) => names.includes("__complete__")).length,
    partialProvinces: mapEntries.filter(
      (names) => names.length > 0 && !names.includes("__complete__"),
    ).length,
    placedNames: mapEntries.reduce(
      (total, names) => total + names.filter((name) => name !== "__complete__").length,
      0,
    ),
    completedNeighborChallenges: Object.values(neighborProgress).filter((names) =>
      names.includes("__complete__"),
    ).length,
    completedLevels: parseArray(snapshot.values[GAUNTLET_PROGRESS_KEY]).length,
    mistakes: parseArray(snapshot.values[GAUNTLET_MISTAKES_KEY]).length,
  };
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function operationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
}

export default function AdminDashboard() {
  const { initialized, identity, isAdmin, offlineIdentity } = usePlayerData();
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "player" | "admin">("all");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlayerRow | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [activeThreshold] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);

  const loadPlayers = useCallback(async () => {
    if (!isAdmin || offlineIdentity) return;
    setLoading(true);
    setError("");
    const supabase = getSupabaseClient();
    try {
      const [profilesResult, progressResult] = await Promise.all([
        supabase
          .from("player_profiles")
          .select("id,email,role,created_at,last_seen_at,updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("user_progress")
          .select("user_id,schema_version,revision,payload,updated_at"),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (progressResult.error) throw progressResult.error;
      const progressByUser = new Map(
        ((progressResult.data ?? []) as AdminProgressRow[]).map((row) => [row.user_id, row]),
      );
      setPlayers(
        ((profilesResult.data ?? []) as PlayerProfile[]).map((profile) => ({
          ...profile,
          progress: progressByUser.get(profile.id) ?? null,
        })),
      );
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "无法读取玩家数据";
      setError(
        message.includes("schema cache") || message.includes("player_profiles")
          ? "管理员数据表尚未初始化，请先在 Supabase 执行项目迁移。"
          : message,
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin, offlineIdentity]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPlayers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadPlayers]);

  const filteredPlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return players.filter((player) => {
      const matchesRole = roleFilter === "all" || player.role === roleFilter;
      const matchesQuery =
        !normalizedQuery ||
        player.email.toLowerCase().includes(normalizedQuery) ||
        player.id.toLowerCase().includes(normalizedQuery);
      return matchesRole && matchesQuery;
    });
  }, [players, query, roleFilter]);

  const dashboardStats = useMemo(() => {
    const withSave = players.filter((player) => player.progress);
    const activeSevenDays = players.filter(
      (player) => Date.parse(player.last_seen_at) >= activeThreshold,
    );
    const passedLevels = withSave.reduce(
      (total, player) => total + summarizeProgress(player.progress?.payload).completedLevels,
      0,
    );
    return {
      total: players.length,
      withSave: withSave.length,
      activeSevenDays: activeSevenDays.length,
      passedLevels,
    };
  }, [activeThreshold, players]);

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
    return <main className="admin-state-page"><strong>正在确认管理员身份…</strong></main>;
  }

  if (!identity) {
    return (
      <main className="admin-state-page">
        <span className="admin-state-mark" aria-hidden="true">锁</span>
        <h1>请先登录管理员账号</h1>
        <p>回到游戏首页，点击右下角“登录保存”完成登录。</p>
        <a href={appPath("/")}>返回游戏首页</a>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-state-page">
        <span className="admin-state-mark" aria-hidden="true">止</span>
        <h1>当前账号没有管理员权限</h1>
        <p>{identity.email} 可以正常游戏，但不能查看其他玩家数据。</p>
        <a href={appPath("/")}>继续游戏</a>
      </main>
    );
  }

  if (offlineIdentity) {
    return (
      <main className="admin-state-page">
        <span className="admin-state-mark" aria-hidden="true">离</span>
        <h1>管理员后台需要联网</h1>
        <p>游戏仍可离线继续；连接网络后刷新此页面即可查看玩家数据。</p>
        <a href={appPath("/")}>返回离线游戏</a>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">ADMIN CONSOLE</p>
          <h1>玩家与进度中心</h1>
          <p>查看玩家账号、活跃时间、地图完成度、闯关进度与完整云存档。</p>
        </div>
        <div className="admin-header-actions">
          <a href={appPath("/")}>← 返回游戏</a>
          <button type="button" onClick={() => void loadPlayers()} disabled={loading}>
            {loading ? "刷新中…" : "刷新数据"}
          </button>
        </div>
      </header>

      <section className="admin-stat-grid" aria-label="玩家统计">
        <article><span>全部玩家</span><strong>{dashboardStats.total}</strong><small>含管理员账号</small></article>
        <article><span>已有云存档</span><strong>{dashboardStats.withSave}</strong><small>至少同步过一次</small></article>
        <article><span>近 7 日活跃</span><strong>{dashboardStats.activeSevenDays}</strong><small>按最近访问时间</small></article>
        <article><span>累计通关</span><strong>{dashboardStats.passedLevels}</strong><small>所有玩家关卡合计</small></article>
      </section>

      <section className="admin-player-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">PLAYER DIRECTORY</p>
            <h2>玩家列表</h2>
          </div>
          <div className="admin-filters">
            <label>
              <span>搜索玩家</span>
              <input
                type="search"
                value={query}
                placeholder="邮箱或用户 ID"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              <span>账号角色</span>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)}
              >
                <option value="all">全部角色</option>
                <option value="player">普通玩家</option>
                <option value="admin">管理员</option>
              </select>
            </label>
          </div>
        </div>

        {notice ? <div className="admin-notice" role="status">{notice}</div> : null}
        {error ? <div className="admin-error" role="alert">{error}</div> : null}
        <div className="admin-table-wrap">
          <table className="admin-player-table">
            <thead>
              <tr>
                <th>玩家</th>
                <th>角色</th>
                <th>全国地图</th>
                <th>闯关进度</th>
                <th>最近活跃</th>
                <th>云存档</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => {
                const summary = summarizeProgress(player.progress?.payload);
                return (
                  <tr key={player.id}>
                    <td>
                      <strong>{player.email}</strong>
                      <small>{player.id}</small>
                    </td>
                    <td><span className={`admin-role admin-role--${player.role}`}>{player.role === "admin" ? "管理员" : "玩家"}</span></td>
                    <td><strong>{summary.completedProvinces}<i>/34</i></strong><small>{summary.placedNames} 个名称已归位</small></td>
                    <td><strong>{summary.completedLevels}<i>/26</i></strong><small>{summary.mistakes} 道待复习错题</small></td>
                    <td><strong>{formatDate(player.last_seen_at)}</strong><small>注册于 {formatDate(player.created_at)}</small></td>
                    <td>
                      <button type="button" onClick={() => setSelectedPlayer(player)}>
                        {player.progress ? "查看 / 管理" : "管理存档"}
                      </button>
                      {!player.progress ? <span className="admin-no-save">尚未同步</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filteredPlayers.length === 0 ? (
            <div className="admin-empty">没有符合当前筛选条件的玩家。</div>
          ) : null}
        </div>
      </section>

      {selectedPlayer ? (
        <div className="admin-detail-backdrop" role="presentation">
          <section className="admin-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-detail-title">
            <button
              className="dialog-close"
              type="button"
              aria-label="关闭玩家详情"
              onClick={() => {
                setSelectedPlayer(null);
                setDeleteTarget(null);
              }}
            >
              ×
            </button>
            <p className="eyebrow">PLAYER DETAIL</p>
            <h2 id="admin-detail-title">{selectedPlayer.email}</h2>
            {(() => {
              const summary = summarizeProgress(selectedPlayer.progress?.payload);
              return (
                <div className="admin-detail-metrics">
                  <div><span>完成省份</span><strong>{summary.completedProvinces}/34</strong></div>
                  <div><span>进行中省份</span><strong>{summary.partialProvinces}</strong></div>
                  <div><span>邻省连城</span><strong>{summary.completedNeighborChallenges}/34</strong></div>
                  <div><span>已过关卡</span><strong>{summary.completedLevels}/26</strong></div>
                </div>
              );
            })()}
            <dl className="admin-account-details">
              <div><dt>用户 ID</dt><dd>{selectedPlayer.id}</dd></div>
              <div><dt>最近活跃</dt><dd>{formatDate(selectedPlayer.last_seen_at)}</dd></div>
              <div><dt>存档版本</dt><dd>{selectedPlayer.progress ? `schema ${selectedPlayer.progress.schema_version} · revision ${selectedPlayer.progress.revision}` : "尚无云存档"}</dd></div>
              <div><dt>最后同步</dt><dd>{formatDate(selectedPlayer.progress?.updated_at ?? "")}</dd></div>
              <div><dt>最近删档</dt><dd>{formatDate(normalizeProgressSnapshot(selectedPlayer.progress?.payload).resetAt ?? "")}</dd></div>
            </dl>
            {selectedPlayer.progress ? (
              <details className="admin-json-details">
                <summary>查看完整存档 JSON</summary>
                <pre>{JSON.stringify(selectedPlayer.progress.payload, null, 2)}</pre>
              </details>
            ) : null}
            <button
              className="admin-delete-progress"
              type="button"
              onClick={() => setDeleteTarget(selectedPlayer)}
              disabled={deletingUserId !== null}
            >
              清除该玩家全部游戏记录
            </button>
            {deleteTarget?.id === selectedPlayer.id ? (
              <section
                className="admin-delete-confirm"
                role="alertdialog"
                aria-labelledby="admin-delete-confirm-title"
                aria-describedby="admin-delete-confirm-description"
              >
                <strong id="admin-delete-confirm-title">再次确认清除 {selectedPlayer.email} 的存档</strong>
                <p id="admin-delete-confirm-description">
                  全国地图、邻省挑战、全部关卡、错题、答题历史和云端备份都会被清除。账号不会删除，此操作不可恢复。
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    disabled={deletingUserId !== null}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="is-danger"
                    onClick={() => void clearPlayerProgress(selectedPlayer)}
                    disabled={deletingUserId !== null}
                  >
                    {deletingUserId === selectedPlayer.id
                      ? "正在清除…"
                      : "确认清除全部记录"}
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
