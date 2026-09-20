import type { Session } from "@supabase/supabase-js";
import type { PlayerProfile } from "@/features/player/model/player-types";
import { saveOfflineAccount } from "@/features/player/model/player-auth";
import { getSupabaseClient } from "@/infrastructure/supabase/client";

export async function loadPlayerProfile(session: Session) {
  let data: PlayerProfile | null = null;
  try {
    const result = await getSupabaseClient()
      .from("player_profiles")
      .select("id,email,role,created_at,last_seen_at,updated_at")
      .eq("id", session.user.id)
      .maybeSingle<PlayerProfile>();
    if (!result.error) data = result.data;
  } catch {
    // 账号身份已经确认时，资料接口失败不应阻塞本机存档和页面使用。
  }

  const profile = !data
    ? {
        id: session.user.id,
        email: session.user.email ?? "",
        role: "player" as const,
        created_at: session.user.created_at,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : data;

  saveOfflineAccount({
    id: profile.id,
    email: profile.email,
    role: profile.role,
  });
  return profile;
}
