import {
  type PlayerIdentity,
  type PlayerRole,
} from "@/features/player/player-data-context";

export type OfflineAccount = PlayerIdentity & { role: PlayerRole };

export const OFFLINE_ACCOUNT_KEY = "china-city-fill-offline-account-v1";

export function readOfflineAccount() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(OFFLINE_ACCOUNT_KEY) ?? "null",
    ) as Partial<OfflineAccount> | null;
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.email === "string" &&
      (parsed.role === "player" || parsed.role === "admin")
    ) {
      return parsed as OfflineAccount;
    }
  } catch {
    // 损坏的离线身份只影响本机回退，不影响 Supabase 登录。
  }
  return null;
}

export function saveOfflineAccount(account: OfflineAccount) {
  localStorage.setItem(OFFLINE_ACCOUNT_KEY, JSON.stringify(account));
}

export function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "邮箱或密码不正确";
  if (normalized.includes("email not confirmed")) return "请先在邮箱中完成验证";
  if (normalized.includes("already registered")) return "这个邮箱已经注册过了";
  if (normalized.includes("password")) return "密码至少需要 8 位";
  if (normalized.includes("fetch") || normalized.includes("network")) {
    return "当前网络不可用，请联网后重试";
  }
  return message;
}
