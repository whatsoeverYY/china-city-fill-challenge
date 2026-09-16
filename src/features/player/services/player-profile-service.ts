import type { Session } from "@supabase/supabase-js";
import type { PlayerProfile } from "@/features/player/model/player-types";
import { saveOfflineAccount } from "@/features/player/model/player-auth";
import { getSupabaseClient } from "@/infrastructure/supabase/client";

export async function loadPlayerProfile(session: Session) {
  const { data, error } = await getSupabaseClient()
    .from("player_profiles")
    .select("id,email,role,created_at,last_seen_at,updated_at")
    .eq("id", session.user.id)
    .maybeSingle<PlayerProfile>();

  const profile = error || !data
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
