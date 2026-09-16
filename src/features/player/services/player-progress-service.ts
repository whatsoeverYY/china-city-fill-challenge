import {
  CURRENT_PROGRESS_SCHEMA_VERSION,
  MAX_PROGRESS_PAYLOAD_BYTES,
} from "@/infrastructure/storage/progress-config";
import {
  assertSupportedProgressVersion,
  createResetProgressSnapshot,
  mergeProgressSnapshots,
  normalizeProgressSnapshot,
  progressPayloadByteLength,
  readLocalProgressSnapshot,
  writeLocalProgressSnapshot,
  type ProgressSnapshot,
} from "@/infrastructure/storage/progress-storage";
import { getSupabaseClient } from "@/infrastructure/supabase/client";

type ProgressRow = {
  user_id: string;
  schema_version: number;
  revision: number;
  payload: unknown;
  updated_at: string;
};

const MAX_SYNC_ATTEMPTS = 2;
const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";

export async function syncPlayerProgress(userId: string) {
  const supabase = getSupabaseClient();
  let local = readLocalProgressSnapshot(userId);
  let savedRow: ProgressRow | null = null;
  let uploadedSnapshot: ProgressSnapshot | null = null;

  for (let attempt = 0; attempt < MAX_SYNC_ATTEMPTS; attempt += 1) {
    const { data: remoteRow, error: readError } = await supabase
      .from("user_progress")
      .select("user_id,schema_version,revision,payload,updated_at")
      .eq("user_id", userId)
      .maybeSingle<ProgressRow>();
    if (readError) throw readError;

    assertSupportedProgressVersion(remoteRow?.schema_version, remoteRow?.payload);
    const merged = mergeProgressSnapshots(
      local,
      remoteRow ? normalizeProgressSnapshot(remoteRow.payload) : null,
    );
    if (progressPayloadByteLength(merged) > MAX_PROGRESS_PAYLOAD_BYTES) {
      throw new Error("游戏存档过大，请先清理部分错题后再同步");
    }

    if (remoteRow) {
      const { data, error } = await supabase
        .from("user_progress")
        .update({
          schema_version: CURRENT_PROGRESS_SCHEMA_VERSION,
          revision: remoteRow.revision + 1,
          payload: merged,
        })
        .eq("user_id", userId)
        .eq("revision", remoteRow.revision)
        .select("user_id,schema_version,revision,payload,updated_at")
        .maybeSingle<ProgressRow>();
      if (error) throw error;
      if (!data) {
        local = merged;
        continue;
      }
      savedRow = data;
    } else {
      const { data, error } = await supabase
        .from("user_progress")
        .insert({
          user_id: userId,
          schema_version: CURRENT_PROGRESS_SCHEMA_VERSION,
          revision: 1,
          payload: merged,
        })
        .select("user_id,schema_version,revision,payload,updated_at")
        .maybeSingle<ProgressRow>();
      if (error?.code === POSTGRES_UNIQUE_VIOLATION_CODE) {
        local = merged;
        continue;
      }
      if (error) throw error;
      savedRow = data;
    }

    uploadedSnapshot = merged;
    break;
  }

  if (!savedRow || !uploadedSnapshot) {
    throw new Error("云存档发生并发更新，请稍后重试");
  }

  const latestLocal = readLocalProgressSnapshot(userId);
  const finalLocal = mergeProgressSnapshots(latestLocal, uploadedSnapshot);
  writeLocalProgressSnapshot(userId, finalLocal);
  void supabase.rpc("touch_player_profile");
  return {
    needsFollowUpSync:
      JSON.stringify(finalLocal) !== JSON.stringify(uploadedSnapshot),
    syncedAt: savedRow.updated_at ?? new Date().toISOString(),
  };
}

export async function clearStoredPlayerProgress(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("clear_player_progress", {
    target_user_id: userId,
  });
  if (error) throw error;
  const resetAt = typeof data === "string" ? data : new Date().toISOString();
  writeLocalProgressSnapshot(userId, createResetProgressSnapshot(resetAt));
  void supabase.rpc("touch_player_profile");
  return resetAt;
}
