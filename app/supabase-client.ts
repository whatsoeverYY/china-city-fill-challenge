import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PRODUCTION_SUPABASE_URL = "https://moeunhlxurnxvdwpbefl.supabase.co";
const PRODUCTION_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ySK5F76QKMNqRa2RBEFGYA_6eLiiPym";

export function resolveSupabaseConfig(input: {
  url?: string;
  publishableKey?: string;
  allowProductionFallback: boolean;
}) {
  const hasCompleteExplicitConfig = Boolean(input.url && input.publishableKey);
  const hasPartialExplicitConfig = Boolean(input.url || input.publishableKey) &&
    !hasCompleteExplicitConfig;
  if (hasCompleteExplicitConfig) {
    return { url: input.url!, publishableKey: input.publishableKey!, error: null };
  }
  if (!hasPartialExplicitConfig && input.allowProductionFallback) {
    return {
      url: PRODUCTION_SUPABASE_URL,
      publishableKey: PRODUCTION_SUPABASE_PUBLISHABLE_KEY,
      error: null,
    };
  }
  return {
    url: "",
    publishableKey: "",
    error: hasPartialExplicitConfig
      ? ".env.local 中的 Supabase URL 与 publishable key 必须同时配置"
      : "本地开发未启用云存档；请在 .env.local 配置 Supabase 后重启开发服务器",
  };
}

const resolvedConfig = resolveSupabaseConfig({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  allowProductionFallback:
    process.env.NEXT_PUBLIC_ALLOW_PRODUCTION_SUPABASE_FALLBACK === "true",
});

export const SUPABASE_URL = resolvedConfig.url;
export const SUPABASE_PUBLISHABLE_KEY = resolvedConfig.publishableKey;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(resolvedConfig.error ?? "Supabase 配置无效");
  }
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
