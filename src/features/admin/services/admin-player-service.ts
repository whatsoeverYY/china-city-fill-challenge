import type {
  AdminPlayerRow,
  AdminProgressDetail,
  AdminProgressSummary,
  DashboardStats,
} from "@/features/admin/model/admin-types";
import { EMPTY_DASHBOARD_STATS } from "@/features/admin/model/admin-types";
import type { PlayerProfile, PlayerRole } from "@/features/player/model/player-types";
import { getSupabaseClient } from "@/infrastructure/supabase/client";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeStats(value: unknown): DashboardStats {
  if (!value || typeof value !== "object") return EMPTY_DASHBOARD_STATS;
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

export async function fetchAdminPlayers({
  page,
  pageSize,
  query,
  role,
}: {
  page: number;
  pageSize: number;
  query: string;
  role: "all" | PlayerRole;
}) {
  const supabase = getSupabaseClient();
  let profilesQuery = supabase
    .from("player_profiles")
    .select("id,email,role,created_at,last_seen_at,updated_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (role !== "all") profilesQuery = profilesQuery.eq("role", role);
  if (query) {
    profilesQuery = isUuid(query)
      ? profilesQuery.eq("id", query)
      : profilesQuery.ilike(
          "email",
          `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`,
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
  const players: AdminPlayerRow[] = profiles.map((profile) => ({
    ...profile,
    progress: progressByUser.get(profile.id) ?? null,
  }));
  return {
    players,
    totalPlayers: profilesResult.count ?? 0,
    stats: normalizeStats(statsResult.data),
  };
}

export async function fetchAdminPlayerProgress(userId: string) {
  const { data, error } = await getSupabaseClient()
    .from("user_progress")
    .select("user_id,schema_version,revision,payload,updated_at")
    .eq("user_id", userId)
    .maybeSingle<AdminProgressDetail>();
  if (error) throw error;
  return data;
}

export async function clearAdminPlayerProgress(userId: string) {
  const { error } = await getSupabaseClient().rpc("clear_player_progress", {
    target_user_id: userId,
  });
  if (error) throw error;
}
